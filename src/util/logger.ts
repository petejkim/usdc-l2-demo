import { EventEmitter } from "events";

const MAX_LOG_SIZE = 50;

const logger = new EventEmitter();

export interface LogEntry {
  text: string;
  url?: string;
  error: boolean;
  createdAt: Date;
}

export const logs: LogEntry[] = [];

export function log(
  text: string,
  options?: { url?: string; error?: boolean }
): void {
  const entry: LogEntry = {
    text,
    url: options?.url,
    error: !!options?.error,
    createdAt: new Date(),
  };

  logs.push(entry);
  if (logs.length > MAX_LOG_SIZE) {
    logs.shift();
  }

  logger.emit("log", entry);
}

export function on(callback: (entry: LogEntry) => void): void {
  logger.on("log", callback);
}

export function off(callback: (entry: LogEntry) => void): void {
  logger.off("log", callback);
}
