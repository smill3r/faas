export interface FunctionOutput {
    result: string;
    statusCode: number;
}

export interface FunctionWorkerMessage {
    success: boolean;
    result: FunctionOutput;
    error: string;
}