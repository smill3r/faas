import { randomUUID } from "crypto";
import { combineLatest, filter, first } from "rxjs";
import { runInChildProcess } from "../business/child-manager";
import { NATS_SETUP } from "../config/nats-config";
import { Consumers, Subjects } from "../types/enums";
import { FunctionOutput } from "../types/function";
import { NatsServiceType } from "./nats.service";

/**
 * Service that handles the function related tasks, it uses the NATS service
 * in order to queue functions execution and notify when functions have been executed.
 */
export class FunctionService {
  // Map of active tasks promises
  private activeTasks = new Map();
  private natsService: NatsServiceType;

  constructor(natsService: NatsServiceType) {
    this.natsService = natsService;
    this.subscribeToMessages();
  }

  /**
   * Registers a function for an user
   * TODO: Implement
   */
  public async publish() {}

  /**
   * Adds a function to the queue, creates a promise for that function execution
   * and a timeout for the function to be executed.
   */
  public async queue(
    image: string,
    parameters: string | string[]
  ): Promise<FunctionOutput | unknown> {
    const taskId = randomUUID();

    // Hold a promise to wait for the task to be fulfilled (the function to be run)
    const taskPromise = new Promise<FunctionOutput>((resolve, reject) => {
      this.activeTasks.set(taskId, { resolve, reject });
    });

    try {
      // Publish the function activation to the NATS queue
      await this.natsService.publishMessage(
        JSON.stringify({ taskId, image, parameters, host: process.env.ID }),
        Subjects.Activations
      );
      // Wait until the promise has ben fulfilled or until the timeout expires
      const result = await taskPromise;

      return result;
    } catch (err) {
      throw err;
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  /**
   * Executes function using child process and promises
   * in order to parallelize execution of multiple functions
   */
  private async executeFunction(
    image: string,
    parameters: string | string[]
  ): Promise<FunctionOutput> {
    let timeoutId;
    try {
      const timeoutPromise = new Promise(
        (_, reject) =>
          (timeoutId = setTimeout(
            () => reject(new Error("Timeout for function execution")),
            NATS_SETUP.timeout
          ))
      );

      const output = await Promise.race([
        runInChildProcess(image, parameters),
        timeoutPromise,
      ]);

      console.log("OUTPUT IS", output);

      return output as FunctionOutput;
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Subscribe to messages that request function activation
   * and orchestrate the execution of said functions
   */
  private onActivatedFunctions(): void {
    this.natsService
      .consumeMessages(Consumers.Activate)
      .subscribe(async (message) => {
        try {
          message.ack();
          const { taskId, image, parameters, host } = JSON.parse(
            message.data.toString()
          );
          const output = await this.executeFunction(image, parameters);
          const originHostSubject = `${Subjects.Completed}.${host}`;
          // Publish message stating that the function was executed and sharing the result
          this.natsService.publishMessage(
            JSON.stringify({
              taskId: taskId,
              result: output,
            }),
            originHostSubject
          );
        } catch {
          message.nak();
        }
      });
  }

  /**
   * Subscribe to messages that indicate function completion, and
   * if those functions were requested on this server instance then
   * resolve the promise that is holding the request to deliver the function
   * result to the user.
   */
  private onCompletedFunctions(): void {
    const instanceConsumerComplete = `${Consumers.Complete}-${process.env.ID}`;
    this.natsService
      .consumeMessages(instanceConsumerComplete)
      .subscribe((message) => {
        message.ack();

        const { taskId, result } = JSON.parse(message.data.toString());

        if (this.activeTasks.has(taskId)) {
          const { resolve } = this.activeTasks.get(taskId);
          resolve(result);
        }
      });
  }

  /**
   * When the NATS service is properly initialized, we subscribe to the messages emitted by the Consumers
   */
  private subscribeToMessages(): void {
    combineLatest([
      this.natsService.jetstreamClientReady,
      this.natsService.jetstreamManagerReady,
    ])
      .pipe(
        filter(
          ([clientReady, managerReady]) =>
            clientReady === true && managerReady === true
        ),
        first()
      )
      .subscribe(() => {
        this.onActivatedFunctions();
        this.onCompletedFunctions();
      });
  }
}
