import { randomUUID } from "crypto";
import Docker, { Container } from "dockerode";
import { combineLatest, filter, first } from "rxjs";
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

  private async pullImage(image: string) {
    return new Promise(async (resolve, reject) => {
      await this.docker.pull(image, (err: any, stream: any) => {
        if (err) {
          reject(new Error("Failed to pull docker image " + image));
        }

        stream.on("data", (data: any) => {
          console.log(data.toString());
        });
        // Resolve when pulling is done
        stream.on("end", resolve);
      });
    });
  }

  private async createContainer(image: string, parameters: string | string[]) {
    return this.docker.createContainer({
      Image: image,
      ExposedPorts: { "8080/tcp": {} },
      Cmd: typeof parameters == "string" ? [parameters] : parameters,
      HostConfig: {
        PortBindings: {
          "8080/tcp": [{ HostPort: "8080" }],
        },
      },
    });
  }

  private async timeout(container: Container) {
    container.stop();
    await container.remove({ force: true, v: true });
    throw Error("Function execution timed out");
  }

  async run(image: string, parameters: string | string[]) {
    await this.pullImage(image);
    // Create a container from the pulled image
    const container = await this.createContainer(image, parameters);

    try {
      await container.start();

      const timeoutId = setTimeout(() => this.timeout(container), 60000);

      // Wait for the container to exit and fetch the logs
      const status = await container.wait();

      // Fetch logs (stdout and stderr)
      const stdoutLogs = await container.logs({
        stdout: true,
        stderr: false,
        follow: false,
      });
      const stderrLogs = await container.logs({
        stdout: false,
        stderr: true,
        follow: false,
      });

      clearTimeout(timeoutId);

      const statusCode = status?.StatusCode;

      const result = {
        result:
          statusCode == 0
            ? this.cleanResult(stdoutLogs.toString())
            : this.cleanResult(stderrLogs.toString()),
        status: statusCode,
      };

      return result;
    } catch (err) {
      throw err;
    } finally {
      await container.remove({ force: true, v: true });
    }
  }

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
          const output = await this.run(image, parameters);
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

  private cleanResult(result: string): string {
    // Step 1: Remove non-printable characters (e.g., \u0002, \u0000)
    const cleanedResult = result.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
  
    // Step 2: Optionally format the error message to make it more readable
    return cleanedResult.trim(); // Trim any leading/trailing whitespace
  }
}
