import ivm from "isolated-vm";

export async function execute(code: string, args: Record<string, unknown>): Promise<unknown> {
  const isolate = new ivm.Isolate({ memoryLimit: 64 });
  try {
    const context = await isolate.createContext();
    await context.global.set("args", new ivm.ExternalCopy(args).copyInto());
    return await context.eval(`(function(args) { ${code} })(args)`, { timeout: 3000, copy: true });
  } finally {
    isolate.dispose();
  }
}
