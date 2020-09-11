const env = process.env; // Destructuring will not work!

/* eslint-disable @typescript-eslint/no-non-null-assertion */

export const NODE_ENV = env.NODE_ENV!;
