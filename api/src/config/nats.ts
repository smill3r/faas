export const NATS_CONFIG = {
  servers: process.env.NATS_URL || "nats://nats:4222",
  token: process.env.NATS_TOKEN,
};

export const KV_BUCKETS = {
  functions: "FUNCTIONS",
  results:   "RESULTS",
} as const;

export const STREAMS = {
  invocations: "INVOCATIONS",
} as const;

export const SUBJECTS = {
  invoke: "invocations.new",
} as const;
