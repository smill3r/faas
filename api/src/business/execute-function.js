const Docker = require("dockerode");

const docker = new Docker();

// Pull a Docker image
async function pullImage(image) {
  return new Promise((resolve, reject) => {
    docker.pull(image, (err, stream) => {
      if (err) {
        return reject(new Error("Failed to pull docker image " + image));
      }

      stream.on("data", (data) => {
        console.log(data.toString());
      });

      stream.on("end", resolve);
      stream.on("error", reject);
    });
  });
}

// Create a Docker container
async function createContainer(image, parameters) {
  return docker.createContainer({
    Image: image,
    ExposedPorts: { "8080/tcp": {} },
    Cmd: typeof parameters === "string" ? [parameters] : parameters,
    HostConfig: {
      PortBindings: {
        "8080/tcp": [{ HostPort: "8080" }],
      },
    },
  });
}

// Timeout handling
async function timeout(container) {
  await container.stop();
  await container.remove({ force: true, v: true });
  throw new Error("Function execution timed out");
}

// Clean result logs
function cleanResult(log) {
  const cleanedResult = log.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
  return cleanedResult.trim();
}

// Listen for messages from the parent process
process.on("message", async ({ image, parameters }) => {
  try {
    await pullImage(image);

    const container = await createContainer(image, parameters);
    await container.start();

    const timeoutId = setTimeout(() => timeout(container), 60000);

    const status = await container.wait();

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
        statusCode === 0
          ? cleanResult(stdoutLogs.toString())
          : cleanResult(stderrLogs.toString()),
      status: statusCode,
    };

    process.send({ success: true, result });
  } catch (err) {
    process.send({ success: false, error: err.message });
  }
});
