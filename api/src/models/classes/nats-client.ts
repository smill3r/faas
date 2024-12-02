import { jetstream, JetStreamClient, JsMsg } from "@nats-io/jetstream";
import { NatsConnection } from "@nats-io/transport-node";
import { Observable } from "rxjs";

/**
 * Class that handles CRUD of streams and consumer resources.
 * Find information on how to use the jetstream library here:
 * https://github.com/nats-io/nats.js/blob/main/jetstream/README.md
 */
export class CustomJetstreamClient {
  private client: JetStreamClient | undefined;
  constructor() {}

  /**
   * Initialize connection and create a manager object to handle CRUD of streams and consumers
   */
  async init(natsConnection: NatsConnection) {
    this.client = await jetstream(natsConnection);
  }

  /**
   * Publish a message received by a stream
   * @param stream
   * @param message
   * @returns
   */
  async publishMessage(subject: string, message: string) {
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
   * @param stream
   * @param consumerName
   * @returns
   */
  async getConsumer(stream: string, consumerName: string) {
    if (this.client) {
      const consumer = await this.client.consumers.get(stream, consumerName);
      return consumer;
    }
  }

  /**
   * The simplest mechanism to process messages is to request a single message.
   * This requires sending a request to the server.
   * When no messages are available, the request will return a null message.
   * @param stream
   * @param consumerName
   */
  observeMessages(stream: string, consumerName: string): Observable<JsMsg> {
    return new Observable((subscriber) => {
      if (!this.client) {
        subscriber.error("Client is not initialized");
        return; 
      }

      const consumeMessages = async () => {
        try {
          const consumer = await this.client!.consumers.get(
            stream,
            consumerName
          );
          const messages = await consumer.consume();

          for await (const msg of messages) {
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
   * Request one message only
   * @param stream
   * @param consumerName
   * @returns
   */
  async requestOneMessage(stream: string, consumerName: string) {
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
