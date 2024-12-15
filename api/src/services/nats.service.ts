import { connect, NatsConnection } from "@nats-io/transport-node";
import { BehaviorSubject } from "rxjs";
import { CustomJetstreamClient } from "../business/nats-client";
import { CustomKVM } from "../business/nats-kv";
import { CustomJetstreamManager } from "../business/nats-manager";
import { NATS_CONFIG, NATS_SETUP } from "../config/nats-config";
import { Consumers, Subjects } from "../types/enums";

/**
 * This service handles all the logic related to the NATS server, which handles
 * the message queue used to distribute the function execution loads to different
 * instances of the API as well as handling re-delivering function activation
 * messages when they have failed.
 */
class NatsService {
  private jetstreamManager: CustomJetstreamManager | undefined;
  private jetstreamClient: CustomJetstreamClient | undefined;
  public jetstreamKV: CustomKVM | undefined;

  public jetstreamClientReady: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public jetstreamManagerReady: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );

  protected natsConnection: NatsConnection | undefined;
  protected onClose: Promise<void | Error> | undefined;
  constructor() {
    this.connect();
    this.onExit();
  }

  public kvGet(key: string) {
    return this.jetstreamKV?.getEntry(NATS_SETUP.kvStore, key);
  }

  public kvPut(key: string, value: any) {
    return this.jetstreamKV?.putEntry(NATS_SETUP.kvStore, key, value);
  }

  public kvDelete(key: string) {
    return this.jetstreamKV?.deleteEntry(NATS_SETUP.kvStore, key);
  }

  public kvPurge(key: string) {
    return this.jetstreamKV?.purgeEntry(NATS_SETUP.kvStore, key);
  }

  /**
   * Publish a message to the stream with a specified subject
   */
  public publishMessage(message: string, subject: string) {
    if (this.jetstreamClient) {
      return this.jetstreamClient.publishMessage(subject, message);
    } else {
      throw new Error(
        "Failed to publish message: No jetstream client initialized yet"
      );
    }
  }

  /**
   * Requests an observable that will emit stream messages
   */
  public consumeMessages(consumer: string, stream = NATS_SETUP.stream) {
    if (this.jetstreamClient) {
      return this.jetstreamClient.observeMessages(stream, consumer);
    } else {
      throw new Error(
        "Failed to subscribe: No jetstream client initialized yet"
      );
    }
  }

  /**
   * Initializes both Jetstream Client and Manager instances and
   * provides them with the NATS connection both classes need to interact
   * with the NATS server
   */
  private async initializeJetstream(
    natsConnection: NatsConnection
  ): Promise<void> {
    this.jetstreamClient = new CustomJetstreamClient();
    await this.jetstreamClient.init(natsConnection);

    this.jetstreamManager = new CustomJetstreamManager();
    await this.jetstreamManager.init(natsConnection);
  }

  /**
   * Configures the Stream and the Consumers needed to send and receive messages
   */
  private async configureStream(): Promise<void> {
    if (this.jetstreamManager && this.jetstreamClient) {
      const allCompleted = `${Subjects.Completed}.*`;
      await this.jetstreamManager.addStream(NATS_SETUP.stream, [
        Subjects.Activations,
        allCompleted,
      ]);

      // Add consumer for function activations
      await this.jetstreamManager.addFilteredDurableConsumer(
        NATS_SETUP.stream,
        Consumers.Activate,
        NATS_SETUP.maxDeliver,
        Subjects.Activations
      );

      // Add consumer for function completions
      const instanceSpecificConsumer = `${Consumers.Complete}-${process.env.ID}`;
      const instanceSpecificSubject = `${Subjects.Completed}.${process.env.ID}`;
      await this.jetstreamManager.addFilteredDurableConsumer(
        NATS_SETUP.stream,
        instanceSpecificConsumer,
        NATS_SETUP.maxDeliver,
        instanceSpecificSubject
      );

      const jc = this.jetstreamClient.getClient();
      if (jc) {
        this.jetstreamKV = new CustomKVM();
        this.jetstreamKV.init(jc);
        this.jetstreamKV.createStore(NATS_SETUP.kvStore);
      }

      this.jetstreamClientReady.next(true);
      this.jetstreamManagerReady.next(true);
    }
  }

  /**
   * Connect to NATS server, initialize Jetstream Client and Manager
   * and setup the Stream and Consumers in case they don't exist.
   */
  private async connect(): Promise<void> {
    try {
      this.natsConnection = await connect(NATS_CONFIG);
      if (this.natsConnection) {
        console.log(`Connected to ${this.natsConnection.getServer()}`);
        this.onClose = this.natsConnection.closed();
        await this.initializeJetstream(this.natsConnection);
        this.configureStream();
      }
    } catch (err) {
      throw new Error(
        `Error connecting to ${JSON.stringify(NATS_CONFIG)}, err: ${err}`
      );
    }
  }

  private async onExit(): Promise<void> {
    process.on("SIGINT", async () => {
      console.log("Shutting down nats connection...");
      await this.closeConnection();
      process.exit(0);
    });
  }

  private async closeConnection(): Promise<void> {
    await this.natsConnection!.close();
    const err = await this.onClose;
    if (err) {
      console.log(`Error closing:`, err);
    }
  }
}

// This export style makes sure that a single instance of the service is shared through the application
export default new NatsService();

// Export the service type
export type NatsServiceType = NatsService;
