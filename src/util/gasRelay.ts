import BN from "bn.js";
import { explorerTxHashUrl } from "./explorer";
import { log } from "./logger";
import { retry, ShortCircuitError } from "./retry";
import { appendError, prepend0x } from "./types";

export async function submitAuthorization(params: {
  type: string;
  address1: string;
  address2: string;
  value: BN;
  validAfter: string;
  validBefore: string;
  nonce: string;
  signature: string;
  gasRelayUrl: string;
  explorerUrl: string;
}): Promise<{ txHash: string; blockNumber: number }> {
  const { gasRelayUrl, explorerUrl } = params;

  const payload = {
    type: params.type,
    address1: params.address1,
    address2: params.address2,
    value: prepend0x(params.value.toString(16)),
    valid_after: params.validAfter,
    valid_before: params.validBefore,
    nonce: params.nonce,
    v: prepend0x(params.signature.slice(130, 132)),
    r: params.signature.slice(2, 66),
    s: prepend0x(params.signature.slice(66, 130)),
  };

  const response = await fetch(`${gasRelayUrl}/authorizations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = await response.json();

  if (typeof json?.id !== "number" || typeof json?.error === "string") {
    throw new Error(appendError("Failed to submit authorization", json?.error));
  }

  const authorizationId = json.id;

  log(
    "Authorization submitted to gas relayer, awaiting transaction submission..."
  );

  const txHash: string = await retry(
    async () => {
      const response = await fetch(
        `${gasRelayUrl}/authorizations/${authorizationId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );
      const json = await response.json();

      if (json?.state === "failed" || typeof json?.error === "string") {
        throw new ShortCircuitError(
          appendError("Could not fetch transaction hash", json?.error)
        );
      }
      if (json?.state === "pending" || typeof json?.tx_hash !== "string") {
        throw new Error(appendError("Submission still pending", json?.error));
      }

      return json.tx_hash;
    },
    { interval: 500 }
  );

  if (typeof txHash !== "string") {
    throw new Error("Failed to get transaction hash.");
  }

  log(`Transaction submitted (${txHash}), awaiting confirmation...`, {
    url: explorerTxHashUrl(explorerUrl, txHash),
  });

  const blockNumber: number = await retry(
    async () => {
      const response = await fetch(
        `${gasRelayUrl}/authorizations/${authorizationId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );
      const json = await response.json();

      if (json?.state !== "confirmed" || typeof json?.error === "string") {
        throw new Error(
          appendError("Could not get confirmation status", json?.error)
        );
      }

      return json.confirmed_block;
    },
    { interval: 500 }
  );

  if (typeof blockNumber !== "number") {
    throw new Error("Failed to get confirmation block number.");
  }

  return { txHash, blockNumber };
}
