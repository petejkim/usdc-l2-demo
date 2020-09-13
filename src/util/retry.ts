// Throw this error to abort retrying
export class ShortCircuitError extends Error {
  public constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, ShortCircuitError.prototype);
    this.name = "ShortCircuitError";
  }
}

export async function retry<T>(
  fn: () => Promise<T>,
  options?: {
    times?: number;
    interval?: number;
  }
): Promise<T> {
  const times = options?.times || 60;
  const interval = options?.interval ?? 1000;

  if (times <= 0) {
    throw new Error("times must be greater than 0");
  }

  let result: T;
  for (let i = 0; i < times; i++) {
    try {
      result = await fn();
    } catch (err) {
      if (err instanceof ShortCircuitError) {
        throw err;
      }

      if (i < times) {
        await sleep(interval);
        continue;
      }

      throw err;
    }
    break;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!;
}

function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve();
    }, duration);
  });
}
