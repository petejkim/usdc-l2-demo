export interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params: any[];
}

export interface JSONRPCResponse<T = any> {
  jsonrpc: "2.0";
  id: number | string;
  error?: {
    code: number;
    message?: string;
    data?: any;
  };
  result?: T;
}

export interface Provider {
  sendAsync: (
    req: JSONRPCRequest,
    callback: (err: Error | null, response: JSONRPCResponse) => void
  ) => void;
}
