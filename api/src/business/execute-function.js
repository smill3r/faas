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
async function createContainer(imageName, parameters) {

  const image = docker.getImage(imageName);
  const imageInfo = await image.inspect();

  const cmd = imageInfo.Config.Cmd;
  const cmdParams = typeof parameters === "string" ? [parameters] : parameters;
  
  const completeCmd = [].concat(cmd || [], cmdParams || []);

  return docker.createContainer({
    Image: imageName,
    ExposedPorts: { "8080/tcp": {} },
    Cmd: completeCmd,
    HostConfig: {
      PortBindings: {
        "8080/tcp": [{ HostPort: "0" }], // Passing 0 indicates that docker will assign a random available port
      },
    },
  });
}

// Clean result logs
function cleanResult(log) {
  const cleanedResult = log.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
  return cleanedResult.trim();
}

// Listen for messages from the parent process
process.on("message", async ({ image, parameters }) => {
  let container;
  try {
    await pullImage(image);
    container = await createContainer(image, parameters);
    await container.start();

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
  } finally {
    await container.remove({ force: true, v: true });
  }
});
