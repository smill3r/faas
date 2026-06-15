import functionService from "../services/function.service";
import natsService from "../services/nats.service";

jest.mock("../services/nats.service", () => ({
  __esModule: true,
  default: {
    connect:           jest.fn(),
    saveFunction:      jest.fn().mockResolvedValue(undefined),
    getFunction:       jest.fn(),
    listFunctions:     jest.fn(),
    deleteFunction:    jest.fn().mockResolvedValue(undefined),
    saveJobResult:     jest.fn().mockResolvedValue(undefined),
    getJobResult:      jest.fn(),
    publishInvocation: jest.fn().mockResolvedValue(undefined),
    close:             jest.fn(),
  },
}));

const mock = {
  saveFunction:      natsService.saveFunction      as jest.Mock,
  getFunction:       natsService.getFunction       as jest.Mock,
  listFunctions:     natsService.listFunctions     as jest.Mock,
  deleteFunction:    natsService.deleteFunction    as jest.Mock,
  saveJobResult:     natsService.saveJobResult     as jest.Mock,
  getJobResult:      natsService.getJobResult      as jest.Mock,
  publishInvocation: natsService.publishInvocation as jest.Mock,
};

const makeRecord = (overrides: Record<string, unknown> = {}) => ({
  name: "add",
  code: "return args.a + args.b;",
  createdAt: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe("register", () => {
  it("saves and returns the function record", async () => {
    const fn = await functionService.register("add", "return args.a + args.b;");
    expect(mock.saveFunction).toHaveBeenCalledWith(
      expect.objectContaining({ name: "add", code: "return args.a + args.b;" })
    );
    expect(fn.name).toBe("add");
    expect(fn.code).toBe("return args.a + args.b;");
  });

  it("stamps a createdAt timestamp", async () => {
    const before = Date.now();
    const fn = await functionService.register("f", "return 1;");
    expect(new Date(fn.createdAt).getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe("get", () => {
  it("returns the record when found", async () => {
    const record = makeRecord();
    mock.getFunction.mockResolvedValue(record);
    expect(await functionService.get("add")).toEqual(record);
  });

  it("throws when the function does not exist", async () => {
    mock.getFunction.mockResolvedValue(null);
    await expect(functionService.get("missing")).rejects.toThrow(
      "Function 'missing' not found"
    );
  });
});

describe("list", () => {
  it("returns all registered functions", async () => {
    const records = [makeRecord(), makeRecord({ name: "greet" })];
    mock.listFunctions.mockResolvedValue(records);
    expect(await functionService.list()).toEqual(records);
  });
});

describe("remove", () => {
  it("throws when the function does not exist", async () => {
    mock.getFunction.mockResolvedValue(null);
    await expect(functionService.remove("missing")).rejects.toThrow(
      "Function 'missing' not found"
    );
  });

  it("deletes the function when it exists", async () => {
    mock.getFunction.mockResolvedValue(makeRecord());
    await functionService.remove("add");
    expect(mock.deleteFunction).toHaveBeenCalledWith("add");
  });
});

describe("invokeSync", () => {
  const setup = (code: string) =>
    mock.getFunction.mockResolvedValue(makeRecord({ code }));

  it("executes arithmetic", async () => {
    setup("return args.a + args.b;");
    expect(await functionService.invokeSync("add", { a: 21, b: 21 })).toBe(42);
  });

  it("executes string operations", async () => {
    setup('return "Hello, " + args.name + "!";');
    expect(await functionService.invokeSync("greet", { name: "World" })).toBe(
      "Hello, World!"
    );
  });

  it("sandboxes code — process is not accessible", async () => {
    setup("return typeof process;");
    expect(await functionService.invokeSync("test", {})).toBe("undefined");
  });

  it("propagates runtime errors from user code", async () => {
    setup('throw new Error("intentional");');
    await expect(functionService.invokeSync("bad", {})).rejects.toThrow(
      "intentional"
    );
  });
});

describe("invokeAsync", () => {
  it("creates a pending job and returns a jobId", async () => {
    mock.getFunction.mockResolvedValue(makeRecord());

    const jobId = await functionService.invokeAsync("add", { a: 1, b: 2 });

    expect(typeof jobId).toBe("string");
    expect(jobId.length).toBeGreaterThan(0);
    expect(mock.saveJobResult).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", functionName: "add", jobId })
    );
    expect(mock.publishInvocation).toHaveBeenCalledWith(
      expect.objectContaining({ jobId, functionName: "add" })
    );
  });
});
