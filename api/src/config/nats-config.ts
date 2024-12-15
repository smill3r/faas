export const NATS_CONFIG = {
  servers: process.env.NATS_URL || "nats://localhost:4222",
  user: process.env.NATS_USER || "",
  pass: process.env.NATS_PASS || "",
};

export const NATS_SETUP = {
  stream: "FUNCTIONS",
  kvStore: "USER_FUNCTIONS",
  consumer: "CONSUMER",
  // Number of times a message will be delivered in case it's not acknowledged if it's processing fails
  maxDeliver: 5,
  maxConcurrent: 10,
  timeout: 60 * 4 * 1000 // 4 minutos
};
