import { randomUUID } from "crypto";
import ivm from "isolated-vm";
import natsService, { NatsServiceType } from "./nats.service";

export interface FunctionRecord {
  name: string;
  code: string;
  createdAt: string;
}

export class FunctionService {
  constructor(private nats: NatsServiceType) {}

  async register(name: string, code: string): Promise<FunctionRecord> {
    const record: FunctionRecord = { name, code, createdAt: new Date().toISOString() };
    await this.nats.saveFunction(record);
    return record;
  }

  async get(name: string): Promise<FunctionRecord> {
    const record = await this.nats.getFunction(name);
    if (!record) throw new Error(`Function '${name}' not found`);
    return record;
  }

  async list(): Promise<FunctionRecord[]> {
    return this.nats.listFunctions();
  }

  async remove(name: string): Promise<void> {
    const existing = await this.nats.getFunction(name);
    if (!existing) throw new Error(`Function '${name}' not found`);
    await this.nats.deleteFunction(name);
  }

  async invokeSync(name: string, args: Record<string, unknown>): Promise<unknown> {
    const record = await this.get(name);
    const isolate = new ivm.Isolate({ memoryLimit: 64 });
    try {
      const context = await isolate.createContext();
      await context.global.set("args", new ivm.ExternalCopy(args).copyInto());
      return await context.eval(`(function(args) { ${record.code} })(args)`, { timeout: 3000, copy: true });
    } finally {
      isolate.dispose();
    }
  }

  async invokeAsync(name: string, args: Record<string, unknown>): Promise<string> {
    await this.get(name);
    const jobId = randomUUID();
    await this.nats.saveJobResult({ jobId, functionName: name, status: "pending" });
    await this.nats.publishInvocation({ jobId, functionName: name, args });
    return jobId;
  }
}

export default new FunctionService(natsService);
