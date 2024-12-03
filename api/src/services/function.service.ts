import { randomUUID } from "crypto";
import Docker from "dockerode";
import { combineLatest, filter, first } from "rxjs";
import { runInChildProcess } from "../business/child-manager";
import { Consumers, Subjects } from "../types/enums";
import { NatsServiceType } from "./nats.service";

export class FunctionService {
  private docker = new Docker();
  private activeTasks = new Map();
  private natsService: NatsServiceType;

  constructor(natsService: NatsServiceType) {
    this.natsService = natsService;
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

  async publish() {}

  async queue(image: string, parameters: string | string[]) {
    const taskId = randomUUID();

    // Hold a promise to wait for the task to be fulfilled (the function to be run)
    const taskPromise = new Promise((resolve, reject) => {
      this.activeTasks.set(taskId, { resolve, reject });
    });

    try {
      // Publish the function activation to the NATS queue
      await this.natsService.publishMessage(
        JSON.stringify({ taskId, image, parameters, host: process.env.ID }),
        Subjects.Activations
      );
      // Wait until the promise has ben fulfilled or until the timeout expires (30 seconds)
      const result = await Promise.race([
        taskPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 30000)
        ),
      ]);

      return result;
    } catch (err) {
      throw err;
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  onActivatedFunctions() {
    this.natsService
      .consumeMessages(Consumers.Activate)
      .subscribe(async (message) => {
        try {
          message.ack();
          const { taskId, image, parameters, host } = JSON.parse(
            message.data.toString()
          );
          // This will be handled by child process in the future
          const output = await runInChildProcess(image, parameters);
          this.natsService.publishMessage(
            JSON.stringify({
              taskId: taskId,
              ...output,
              host,
            }),
            `${Subjects.Completed}.${host}`
          );
        } catch {
          message.nak();
        }
      });
  }

  onCompletedFunctions() {
    this.natsService
      .consumeMessages(`${Consumers.Complete}-${process.env.ID}`)
      .subscribe((message) => {
        const { taskId, result, status, host } = JSON.parse(
          message.data.toString()
        );

        if (this.activeTasks.has(taskId)) {
          message.ack();
          const { resolve, reject } = this.activeTasks.get(taskId);
          if (status == 0) {
            resolve(result);
          } else {
            reject(result);
          }
        }
      });
  }

}
