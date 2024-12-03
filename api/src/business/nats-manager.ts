import {
  AckPolicy,
  JetStreamManager,
  jetstreamManager,
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
  async init(natsConnection: NatsConnection) {
    this.manager = await jetstreamManager(natsConnection);
  }

  /**
   * Creates a stream, message stores, each stream defines how messages are stored and
   * what the limits (duration, size, interest) of the retention are.
   * @param streamName
   * @param subjects
   */
  async addStream(streamName: string, subjects: string[]) {
    if (this.manager) {
      return this.manager.streams.add({
        name: streamName,
        subjects: subjects,
      });
    }
  }

  /**
   * Purge all messages in the stream, the stream itself remains.
   * @param stream
   * @returns purge status
   */
  async purgeStream(stream: string) {
    if (this.manager) {
      return this.manager.streams.purge(stream);
    }
  }

  /**
   * Add a new durable consumer, a consumer acts as an interface for clients to consume a
   * subset of messages stored in a stream and will keep track of which messages
   * were delivered and acknowledged by clients.
   * @param stream
   * @param durable_name
   * @returns
   */
  async addDurableConsumer(
    stream: string,
    durable_name: string,
    max_deliver: number
  ) {
    if (this.manager) {
      return this.manager.consumers.add(stream, {
        durable_name: durable_name,
        ack_policy: AckPolicy.Explicit,
        max_deliver: max_deliver,
      });
    }
  }

  async addFilteredDurableConsumer(
    stream: string,
    durable_name: string,
    max_deliver: number,
    filter_subject: string
  ) {
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
   * @param stream
   * @returns
   */
  async getStreamConsumers(stream: string) {
    if (this.manager) {
      const consumers = await this.manager.consumers.list(stream).next();
      return consumers;
    }
  }
}
