import { execute } from "../executor";

describe("execute", () => {
  it("evaluates arithmetic", async () => {
    expect(await execute("return args.a + args.b;", { a: 2, b: 3 })).toBe(5);
  });

  it("evaluates string operations", async () => {
    expect(
      await execute('return "Hello, " + args.name + "!";', { name: "World" })
    ).toBe("Hello, World!");
  });

  it("supports multi-line code", async () => {
    expect(await execute("const x = args.n * 2;\nreturn x + 1;", { n: 5 })).toBe(11);
  });

  it("sandboxes — process is not accessible", async () => {
    expect(await execute("return typeof process;", {})).toBe("undefined");
  });

  it("sandboxes — require is not accessible", async () => {
    expect(await execute("return typeof require;", {})).toBe("undefined");
  });

  it("sandboxes — prototype chain escape blocked", async () => {
    await expect(
      execute('return this.constructor.constructor("return process.version")();', {})
    ).rejects.toThrow();
  });

  it("propagates errors thrown by user code", async () => {
    await expect(execute('throw new Error("boom");', {})).rejects.toThrow("boom");
  });

  it("enforces the execution timeout", async () => {
    await expect(execute("while (true) {}", {})).rejects.toThrow();
  }, 5000);
});
