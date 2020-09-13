import BN from "bn.js";
import React, { useCallback, useState } from "react";
import Web3 from "web3";
import spinner from "../images/spinner.svg";
import { retry } from "../util/retry";
import { bnFromDecimalString, prepend0x, strip0x } from "../util/types";
import { Button } from "./Button";
import { HintBubble } from "./HintBubble";
import { TextField } from "./TextField";
import "./TransferToken.scss";

const TRANSFER_SELECTOR = "0xa9059cbb";
const UINT256_MIN =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const UINT256_MAX =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

export interface TransferTokenProps {
  web3: Web3 | null;
  userAddress: string;
  contractAddress: string;
  balance: BN | null;
  decimalPlaces: number;
  gasAbstraction?: {
    relayUrl: string;
    eip712: EIP712Options;
  };
  signerWeb3?: Web3 | null;
}

export interface EIP712Options {
  useSalt: boolean; // use salt field for chainId, for cross-chain signing
  name: string;
  version: string;
  chainId: number;
}

export function TransferToken(props: TransferTokenProps): JSX.Element {
  const {
    web3,
    userAddress,
    contractAddress,
    balance,
    decimalPlaces,
    gasAbstraction,
    signerWeb3,
  } = props;

  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [signing, setSigning] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  const changeAmount = useCallback((v: string) => {
    setAmount(v.replace(/[^\d.]/g, "") || "");
  }, []);

  const parsedAmount = bnFromDecimalString(amount, decimalPlaces);

  const sendTokens = useCallback(() => {
    if (!web3 || !parsedAmount) {
      return;
    }
    if (gasAbstraction && signerWeb3) {
      performGaslessTransfer({
        from: userAddress,
        to: recipient,
        amount: parsedAmount,
        gasRelayUrl: gasAbstraction.relayUrl,
        eip712: gasAbstraction.eip712,
        contractAddress,
        signerWeb3: signerWeb3,
        setSigning,
        setSending,
      });
    } else {
      performTransfer({
        from: userAddress,
        to: recipient,
        amount: parsedAmount,
        contractAddress,
        web3,
        setSigning,
        setSending,
      });
    }
  }, [
    web3,
    signerWeb3,
    userAddress,
    contractAddress,
    gasAbstraction,
    parsedAmount,
    recipient,
  ]);

  const recipientValid = Web3.utils.isAddress(recipient);
  const amountValid = !!parsedAmount;
  const amountTooBig = !!(balance && parsedAmount?.gt(balance));
  const disableSend =
    !recipient ||
    !recipientValid ||
    !amount ||
    !amountValid ||
    amountTooBig ||
    signing ||
    sending;

  return (
    <div className="TransferToken">
      <div className="TransferToken-recipient-field">
        <TextField
          value={recipient}
          placeholder="Recipient address (0x1234...)"
          onChange={setRecipient}
        />
        {recipient && !recipientValid && (
          <HintBubble>Address entered is invalid.</HintBubble>
        )}
      </div>
      <div className="TransferToken-second-row">
        <div className="TransferToken-amount-field">
          <TextField
            value={amount}
            placeholder="Amount (12.34)"
            onChange={changeAmount}
          />
          {amount && !amountValid && (
            <HintBubble>Amount entered is invalid.</HintBubble>
          )}
          {amount && amountTooBig && (
            <HintBubble>
              Amount entered is greater than current balance.
            </HintBubble>
          )}
        </div>
        {sending && (
          <img className="TransferToken-spinner" src={spinner} alt="" />
        )}
        <Button disabled={disableSend} onClick={sendTokens}>
          {signing ? "Confirming..." : sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}

function performTransfer(options: {
  from: string;
  to: string;
  amount: BN;
  contractAddress: string;
  web3: Web3;
  setSigning: (signing: boolean) => void;
  setSending: (sending: boolean) => void;
}): void {
  const {
    from,
    to,
    amount,
    contractAddress,
    web3,
    setSigning,
    setSending,
  } = options;

  setSigning(true);

  web3.eth
    .sendTransaction({
      from,
      to: contractAddress,
      data:
        TRANSFER_SELECTOR +
        strip0x(
          web3.eth.abi.encodeParameters(["address", "uint256"], [to, amount])
        ),
    })
    .on("transactionHash", (_txHash) => {
      setSigning(false);
      setSending(true);
    })
    .finally(() => {
      setSigning(false);
      setSending(false);
    });
}

function performGaslessTransfer(options: {
  from: string;
  to: string;
  amount: BN;
  gasRelayUrl: string;
  eip712: EIP712Options;
  contractAddress: string;
  signerWeb3: Web3;
  setSigning: (signing: boolean) => void;
  setSending: (sending: boolean) => void;
}): void {
  const {
    from,
    to,
    amount,
    gasRelayUrl,
    eip712,
    contractAddress,
    signerWeb3,
    setSigning,
    setSending,
  } = options;

  setSigning(true);

  const validAfter = UINT256_MIN;
  const validBefore = UINT256_MAX;
  const nonce = signerWeb3.utils.randomHex(32);

  const data = {
    types: {
      EIP712Domain: eip712.useSalt
        ? [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "verifyingContract", type: "address" },
            { name: "salt", type: "bytes32" },
          ]
        : [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    domain: eip712.useSalt
      ? {
          name: eip712.name,
          version: eip712.version,
          verifyingContract: contractAddress,
          salt: prepend0x(eip712.chainId.toString(16).padStart(64, "0")),
        }
      : {
          name: eip712.name,
          version: eip712.version,
          chainId: eip712.chainId,
          verifyingContract: contractAddress,
        },
    primaryType: "TransferWithAuthorization",
    message: {
      from,
      to,
      value: amount.toString(10),
      validAfter,
      validBefore,
      nonce,
    },
  };

  const provider = signerWeb3.currentProvider as {
    sendAsync: (
      req: {
        jsonrpc: "2.0";
        id: number;
        method: string;
        params: any[];
      },
      callback: (
        err: Error | null,
        response: { result?: any; error?: any }
      ) => void
    ) => void;
  };

  provider.sendAsync(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_signTypedData_v3",
      params: [from, JSON.stringify(data)],
    },
    (err, response) => {
      setSigning(false);
      if (err || !response?.result) {
        return;
      }

      setSending(true);
      submitAuthorization(
        from,
        to,
        amount,
        validAfter,
        validBefore,
        nonce,
        response.result as string,
        gasRelayUrl
      ).finally(() => {
        setSending(false);
      });
    }
  );
}

async function submitAuthorization(
  from: string,
  to: string,
  amount: BN,
  validAfter: string,
  validBefore: string,
  nonce: string,
  signature: string,
  gasRelayUrl: string
): Promise<void> {
  const payload = {
    type: "transfer",
    address1: from,
    address2: to,
    value: prepend0x(amount.toString(16)),
    valid_after: validAfter,
    valid_before: validBefore,
    nonce,
    v: prepend0x(signature.slice(130, 132)),
    r: signature.slice(2, 66),
    s: prepend0x(signature.slice(66, 130)),
  };

  const authorizationId = await retry(async () => {
    const response = await fetch(`${gasRelayUrl}/authorizations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = await response.json();

    if (typeof json?.error === "string") {
      throw new Error(json.error);
    }
    if (typeof json?.id !== "number") {
      throw new Error("Failed to submit transfer authorization");
    }

    return json.id;
  });

  await retry(async () => {
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

    if (typeof json?.error === "string") {
      throw new Error(json.error);
    }
    if (typeof json?.tx_hash !== "string") {
      throw new Error("Could not fetch transaction hash.");
    }

    return json.tx_hash;
  });

  await retry(async () => {
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

    if (typeof json?.error === "string") {
      throw new Error(json.error);
    }
    if (json?.state !== "confirmed") {
      throw new Error("Could not get confirmation status.");
    }
  });
}
