import { connect } from "@nats-io/transport-node";
import { jetstream, jetstreamManager, AckPolicy } from "@nats-io/jetstream";
import { Kvm } from "@nats-io/kv";
import { execute } from "./executor";

const NATS_URL   = process.env.NATS_URL   || "nats://nats:4222";
const NATS_TOKEN = process.env.NATS_TOKEN;
const STREAM    = "INVOCATIONS";
const CONSUMER  = "runner";
const KV_BUCKET = "RESULTS";

interface InvocationPayload {
  jobId: string;
  functionName: string;
  code: string;
  args: Record<string, unknown>;
  startedAt: string;
}

async function main() {
  const nc = await connect({ servers: NATS_URL, token: NATS_TOKEN });
  console.log(`Runner connected to NATS: ${nc.getServer()}`);

  const kvm = new Kvm(nc);
  const resultsKv = await kvm
    .create(KV_BUCKET, { history: 1 })
    .catch(() => kvm.open(KV_BUCKET));

  const jsm = await jetstreamManager(nc);

  await jsm.streams
    .add({ name: STREAM, subjects: ["invocations.*"] })
    .catch(() => {});

  await jsm.consumers
    .add(STREAM, { durable_name: CONSUMER, ack_policy: AckPolicy.Explicit })
    .catch(() => {});

  const js = jetstream(nc);
  const consumer = await js.consumers.get(STREAM, CONSUMER);
  const messages = await consumer.consume();

  console.log("Runner ready — waiting for invocations");

  for await (const msg of messages) {
    const payload = JSON.parse(new TextDecoder().decode(msg.data)) as InvocationPayload;
    console.log(`Executing job ${payload.jobId} (${payload.functionName})`);

    let status: "complete" | "error";
    let result: unknown;
    let error: string | undefined;

    try {
      result = await execute(payload.code, payload.args ?? {});
      status = "complete";
    } catch (err) {
      error  = err instanceof Error ? err.message : String(err);
      status = "error";
    }

    await resultsKv.put(
      payload.jobId,
      JSON.stringify({
        jobId: payload.jobId,
        functionName: payload.functionName,
        args: payload.args,
        status,
        result,
        error,
        startedAt: payload.startedAt,
        completedAt: new Date().toISOString(),
      })
    );

    console.log(`Job ${payload.jobId}: ${status}`);
    msg.ack();
  }
}

main().catch((err) => {
  console.error("Runner fatal error:", err);
  process.exit(1);
});
