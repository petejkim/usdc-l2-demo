export interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params: any[];
}

export interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: number | string;
  error?: {
    code: number;
    message?: string;
    data?: any;
  };
  result?: any;
}

export interface Provider {
  sendAsync: (
    req: JSONRPCRequest,
    callback: (err: Error | null, response: JSONRPCResponse) => void
  ) => void;
}
