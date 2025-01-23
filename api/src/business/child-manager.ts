import { FunctionOutput, FunctionWorkerMessage } from "../types/function";

import path from "path";

const { fork } = require("child_process");

export function runInChildProcess(
  image: string,
  parameters: string | string[]
): Promise<FunctionOutput> {
  return new Promise((resolve, reject) => {
    const childProcessPath = path.join(__dirname, "execute-function.js");
    const worker = fork(childProcessPath);

    // Send data to the child process
    worker.send({ image, parameters });

    // Listen for messages from the child process
    worker.on("message", (message: FunctionWorkerMessage) => {
      if (message.success) {
        resolve(message.result);
      } else {
        reject(new Error(message.error));
      }
      worker.kill();
    });

    // Handle errors
    worker.on("error", (err: any) => {
      reject(err);
      worker.kill();
    });

    // Handle process exit
    worker.on("exit", (code: number) => {
      if (code !== 0) {
        reject(new Error(`Child process exited with code ${code}`));
      }
    });
  });
}
