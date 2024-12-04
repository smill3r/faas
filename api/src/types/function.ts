export interface FunctionOutput {
    result: string;
    status: number;
}

export interface FunctionWorkerMessage {
    success: boolean;
    result: FunctionOutput;
    error: string;
}