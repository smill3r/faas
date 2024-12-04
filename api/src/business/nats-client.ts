import {
  Consumer,
  jetstream,
  JetStreamClient,
  JsMsg,
  PubAck,
} from "@nats-io/jetstream";
import { NatsConnection } from "@nats-io/transport-node";
import { Observable } from "rxjs";

/**
 * The JetStream client presents an API for adding messages to a stream or processing messages stored in a stream.
 * Find information on how to use the jetstream library here:
 * https://github.com/nats-io/nats.js/blob/main/jetstream/README.md
 */
export class CustomJetstreamClient {
  private client: JetStreamClient | undefined;
  constructor() {}

  /**
   * Initialize connection and create a manager object to handle CRUD of streams and consumers
   */
  public async init(natsConnection: NatsConnection): Promise<void> {
    this.client = await jetstream(natsConnection);
  }

  /**
   * Publish a message that will be received by the configured stream and then
   * distributed to consumers
   */
  public async publishMessage(
    subject: string,
    message: string
  ): Promise<PubAck | undefined> {
    if (this.client) {
      try {
        const ack = await this.client.publish(subject, message);
        return ack;
      } catch {
        // This catch is needed for avoiding issues related to publishing confirmation
        return;
      }
    }
    return;
  }

  /**
   * Retrieve an existing consumer
   */
  public async getConsumer(
    stream: string,
    consumerName: string
  ): Promise<Consumer | undefined> {
    if (this.client) {
      const consumer = await this.client.consumers.get(stream, consumerName);
      return consumer;
    }
  }

  /**
   * From a specified Consumer, this function will use a function that
   * requests an async iterator which yields the messages that the
   * consumer receives, then it will return an observable that will emit those
   * values when subscribed.
   */
  public observeMessages(stream: string, consumerName: string): Observable<JsMsg> {
    return new Observable((subscriber) => {
      if (!this.client) {
        subscriber.error("Client is not initialized");
        return;
      }

      // Function that requests the messages from the consumer
      const consumeMessages = async () => {
        try {
          const consumer = await this.client!.consumers.get(
            stream,
            consumerName
          );
          const messages = await consumer.consume();

          for await (const msg of messages) {
            // Emit the messages to the subscriber, message acnkowledgment will be handled by the subscriber
            subscriber.next(msg);
          }
        } catch (err) {
          console.log(`consume failed: ${(err as Error).message}`);
          subscriber.error(err);
        }
      };

      // Call the async function
      consumeMessages();

      // Cleanup logic for when the subscription is closed
      return () => {
        console.log("Unsubscribed from messages");
      };
    });
  }

  /**
   * Request one message only.
   */
  public async requestOneMessage(stream: string, consumerName: string): Promise<string | undefined> {
    if (this.client) {
      const consumer = await this.client.consumers.get(stream, consumerName);

      const message = await consumer.next();
      if (message) {
        message.ack();
        return message.subject;
      } else {
        return `Didn't get a message`;
      }
    }
  }
}
