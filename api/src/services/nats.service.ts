import { connect, NatsConnection } from "@nats-io/transport-node";
import { BehaviorSubject } from "rxjs";
import { NATS_CONFIG, NATS_SETUP } from "../config/nats-config";
import { CustomJetstreamClient } from "../business/nats-client";
import { CustomJetstreamManager } from "../business/nats-manager";
import { Consumers, Subjects } from "../types/enums";

class NatsService {
  private jetstreamManager: CustomJetstreamManager | undefined;
  private jetstreamClient: CustomJetstreamClient | undefined;

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

  public publishMessage(message: string, subject: string) {
    if (this.jetstreamClient) {
      return this.jetstreamClient.publishMessage(subject, message);
    } else {
      throw new Error(
        "Failed to publish message: No jetstream client initialized yet"
      );
    }
  }

  public consumeMessages(
    consumer = NATS_SETUP.consumer,
    stream = NATS_SETUP.stream
  ) {
    if (this.jetstreamClient) {
      return this.jetstreamClient.observeMessages(stream, consumer);
    } else {
      throw new Error(
        "Failed to subscribe: No jetstream client initialized yet"
      );
    }
  }

  private async connect(): Promise<void> {
    try {
      this.natsConnection = await connect(NATS_CONFIG);
      if (this.natsConnection) {
        console.log(`Connected to ${this.natsConnection.getServer()}`);
        this.onClose = this.natsConnection.closed();

        this.jetstreamManager = new CustomJetstreamManager();
        this.jetstreamClient = new CustomJetstreamClient();

        await this.jetstreamClient.init(this.natsConnection);
        await this.jetstreamManager.init(this.natsConnection);
        // Create stream and consumer in case they don't exist
        const stream = await this.jetstreamManager.addStream(
          NATS_SETUP.stream,
          [Subjects.Activations, `${Subjects.Completed}.*`]
        ); 
        const consumer = await this.jetstreamManager.addDurableConsumer(
          NATS_SETUP.stream,
          NATS_SETUP.consumer,
          NATS_SETUP.maxDeliver
        );

        // Add consumer for function activations
        await this.jetstreamManager.addFilteredDurableConsumer(
          NATS_SETUP.stream,
          Consumers.Activate,
          NATS_SETUP.maxDeliver,
          Subjects.Activations
        );

        // Add consumer for function completions
        await this.jetstreamManager.addFilteredDurableConsumer(
          NATS_SETUP.stream,
          `${Consumers.Complete}-${process.env.ID}`,
          NATS_SETUP.maxDeliver,
          `${Subjects.Completed}.${process.env.ID}`
        );

        this.jetstreamClientReady.next(true);
        this.jetstreamManagerReady.next(true);
      }
    } catch (err) {
      console.log(
        `Error connecting to ${JSON.stringify(NATS_CONFIG)}, err: ${err}`
      );
    }
  }

  private async onExit() {
    process.on("SIGINT", async () => {
      console.log("Shutting down nats connection...");
      await this.closeConnection();
      process.exit(0);
    });
  }

  private async closeConnection() {
    await this.natsConnection!.close();
    const err = await this.onClose;
    if (err) {
      console.log(`Error closing:`, err);
    }
  }
}

export default new NatsService();

export type NatsServiceType = NatsService;
