export interface FunctionRecord {
  name: string;
  code: string;
  createdAt: string;
}

export interface JobRecord {
  jobId: string;
  functionName: string;
  args: Record<string, unknown>;
  status: "pending" | "complete" | "error";
  result?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface InvocationPayload {
  jobId: string;
  functionName: string;
  code: string;
  args: Record<string, unknown>;
  startedAt: string;
}
