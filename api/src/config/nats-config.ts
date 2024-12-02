export const NATS_CONFIG = {
  servers: process.env.NATS_URL || "nats://localhost:4222",
  user: process.env.NATS_USER || "",
  pass: process.env.NATS_PASS || "",
};

export const NATS_SETUP = {
  stream: 'FUNCTIONS',
  consumer: 'CONSUMER',
  maxDeliver: 5
}