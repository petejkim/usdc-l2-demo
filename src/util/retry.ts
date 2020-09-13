export async function retry<T>(
  fn: () => Promise<T>,
  times = 30,
  interval = 1000
): Promise<T> {
  if (times <= 0) {
    throw new Error("times must be greater than 0");
  }
  let result: T;
  for (let i = 0; i < times; i++) {
    try {
      result = await fn();
    } catch (err) {
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
