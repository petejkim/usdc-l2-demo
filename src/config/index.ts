const env = process.env; // Destructuring will not work!

/* eslint-disable @typescript-eslint/no-non-null-assertion */

export const NODE_ENV = env.NODE_ENV!;
export const L1_CHAIN_ID = Number(env.REACT_APP_L1_CHAIN_ID!);
export const L2_CHAIN_ID = Number(env.REACT_APP_L2_CHAIN_ID!);
export const L2_JSON_RPC_URL = env.REACT_APP_L2_JSON_RPC_URL!;
export const L1_CONTRACT_ADDRESS = env.REACT_APP_L1_CONTRACT_ADDRESS!;
export const L2_CONTRACT_ADDRESS = env.REACT_APP_L2_CONTRACT_ADDRESS!;
export const L1_CONTRACT_NAME = env.REACT_APP_L1_CONTRACT_NAME!;
export const L2_CONTRACT_NAME = env.REACT_APP_L2_CONTRACT_NAME!;
export const L1_CONTRACT_VERSION = env.REACT_APP_L1_CONTRACT_VERSION!;
export const L2_CONTRACT_VERSION = env.REACT_APP_L2_CONTRACT_VERSION!;
export const L2_GAS_RELAY_URL = env.REACT_APP_L2_GAS_RELAY_URL!;
export const L1_EXPLORER_URL = env.REACT_APP_L1_EXPLORER_URL!;
export const L2_EXPLORER_URL = env.REACT_APP_L2_EXPLORER_URL!;
