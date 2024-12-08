import {
  AckPolicy,
  ConsumerInfo,
  JetStreamManager,
  jetstreamManager,
  PurgeResponse,
  StreamInfo,
} from "@nats-io/jetstream";
import { NatsConnection } from "@nats-io/transport-node";

/**
 * Class that handles CRUD of streams and consumer resources.
 * Find information on how to use the jetstream library here:
 * https://github.com/nats-io/nats.js/blob/main/jetstream/README.md
 */

export class CustomJetstreamManager {
  private manager: JetStreamManager | undefined;
  constructor() {}

  /**
   * Initialize connection and create a manager object to handle CRUD of streams and consumers
   */
  public async init(natsConnection: NatsConnection): Promise<void> {
    this.manager = await jetstreamManager(natsConnection);
  }

  /**
   * Creates a stream, message stores, each stream defines how messages are stored and
   * what the limits (duration, size, interest) of the retention are.
   * The function is idempotent, meaning that if the Stream already exists
   * it doesn't create a new one or override it.
   */
  public async addStream(
    streamName: string,
    subjects: string[]
  ): Promise<StreamInfo | undefined> {
    if (this.manager) {
      return this.manager.streams.add({
        name: streamName,
        subjects: subjects,
      });
    }
  }

  /**
   * Purge all messages in the stream, the stream itself remains.
   */
  public async purgeStream(stream: string): Promise<PurgeResponse | undefined> {
    if (this.manager) {
      return this.manager.streams.purge(stream);
    }
  }

  /**
   * Add a new durable consumer, a consumer acts as an interface for clients to consume a
   * subset of messages stored in a stream and will keep track of which messages
   * were delivered and acknowledged by clients.
   */
  public async addDurableConsumer(
    stream: string,
    durable_name: string,
    max_deliver: number
  ): Promise<ConsumerInfo | undefined> {
    if (this.manager) {
      return this.manager.consumers.add(stream, {
        durable_name: durable_name,
        ack_policy: AckPolicy.Explicit,
        max_deliver: max_deliver,
      });
    }
  }

  /**
   * Add a new durable consumer that will filter messages by a provided subject
   * and only consume messages that have the specified subject.
   */
  public async addFilteredDurableConsumer(
    stream: string,
    durable_name: string,
    max_deliver: number,
    filter_subject: string
  ): Promise<ConsumerInfo | undefined> {
    if (this.manager) {
      return this.manager.consumers.add(stream, {
        durable_name: durable_name,
        ack_policy: AckPolicy.Explicit,
        max_deliver: max_deliver,
        filter_subject: filter_subject,
      });
    }
  }

  /**
   * List all consumers for a stream.
   */
  public async getStreamConsumers(
    stream: string
  ): Promise<ConsumerInfo[] | undefined> {
    if (this.manager) {
      const consumers = await this.manager.consumers.list(stream).next();
      return consumers;
    }
  }
}
