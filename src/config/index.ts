const env = process.env; // Destructuring will not work!

/* eslint-disable @typescript-eslint/no-non-null-assertion */

export const NODE_ENV = env.NODE_ENV!;
export const L2_JSON_RPC_URL = env.REACT_APP_L2_JSON_RPC_URL!;
export const L1_CONTRACT_ADDRESS = env.REACT_APP_L1_CONTRACT_ADDRESS!;
export const L2_CONTRACT_ADDRESS = env.REACT_APP_L2_CONTRACT_ADDRESS!;
export const L2_GAS_RELAY_URL = env.REACT_APP_L2_GAS_RELAY_URL!;
