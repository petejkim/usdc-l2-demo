import { prepend0x } from "./types";

export interface EIP712Options {
  useSalt: boolean; // use salt field for chainId, for cross-chain signing
  name: string;
  version: string;
  chainId: number;
}

export function makeEIP712Data(
  domain: {
    name: string;
    version: string;
    verifyingContract: string;
    salt?: string | number;
    chainId?: number;
  },
  types: Record<string, { name: string; type: string }[]>,
  primaryType: string,
  message: Record<string, any>
): string {
  const domainTypes = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
  ];
  if (typeof domain.chainId === "number") {
    domainTypes.push({ name: "chainId", type: "uint256" });
  }
  domainTypes.push({ name: "verifyingContract", type: "address" });
  if (typeof domain.salt === "string" || typeof domain.salt === "number") {
    domainTypes.push({ name: "salt", type: "bytes32" });
  }

  const domainData = {
    ...domain,
    salt:
      typeof domain.salt === "number"
        ? prepend0x(domain.salt.toString(16).padStart(64, "0"))
        : domain.salt,
  };

  return JSON.stringify({
    types: {
      EIP712Domain: domainTypes,
      ...types,
    },
    domain: domainData,
    primaryType,
    message,
  });
}
