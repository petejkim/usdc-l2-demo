import BN from "bn.js";
import React, { useCallback, useState } from "react";
import Web3 from "web3";
import spinner from "../images/spinner.svg";
import { Provider } from "../types/Provider";
import { UINT256_MAX, UINT256_MIN } from "../util/constants";
import { EIP712Options, makeEIP712Data } from "../util/eip712";
import { explorerTxHashUrl } from "../util/explorer";
import { submitAuthorization } from "../util/gasRelay";
import { log } from "../util/logger";
import { appendError, bnFromDecimalString, strip0x } from "../util/types";
import { Button } from "./Button";
import { HintBubble } from "./HintBubble";
import { TextField } from "./TextField";
import "./TransferToken.scss";

const TRANSFER_SELECTOR = "0xa9059cbb";

export interface TransferTokenProps {
  signerWeb3: Web3 | null;
  userAddress: string;
  contractAddress: string;
  balance: BN | null;
  decimalPlaces: number;
  gasAbstraction?: {
    relayUrl: string;
    eip712: EIP712Options;
  };
  explorerUrl: string;
}

export function TransferToken(props: TransferTokenProps): JSX.Element {
  const {
    signerWeb3,
    userAddress,
    contractAddress,
    balance,
    decimalPlaces,
    gasAbstraction,
    explorerUrl,
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
    if (!signerWeb3 || !parsedAmount) {
      return;
    }
    if (gasAbstraction && signerWeb3) {
      performGaslessTransfer({
        signerWeb3,
        from: userAddress,
        to: recipient,
        amount: parsedAmount,
        gasRelayUrl: gasAbstraction.relayUrl,
        eip712: gasAbstraction.eip712,
        contractAddress,
        explorerUrl,
        setSigning,
        setSending,
      });
    } else {
      performDirectTransfer({
        signerWeb3,
        from: userAddress,
        to: recipient,
        amount: parsedAmount,
        contractAddress,
        explorerUrl,
        setSigning,
        setSending,
      });
    }
  }, [
    signerWeb3,
    userAddress,
    contractAddress,
    gasAbstraction,
    explorerUrl,
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

function performDirectTransfer(options: {
  signerWeb3: Web3;
  from: string;
  to: string;
  amount: BN;
  contractAddress: string;
  explorerUrl: string;
  setSigning: (v: boolean) => void;
  setSending: (v: boolean) => void;
}): void {
  const {
    signerWeb3,
    from,
    to,
    amount,
    contractAddress,
    explorerUrl,
    setSigning,
    setSending,
  } = options;

  setSigning(true);
  log("Awaiting signature for direct transfer...");

  signerWeb3.eth
    .sendTransaction({
      from,
      to: contractAddress,
      data:
        TRANSFER_SELECTOR +
        strip0x(
          signerWeb3.eth.abi.encodeParameters(
            ["address", "uint256"],
            [to, amount]
          )
        ),
    })
    .on("error", (err) => {
      let errMsg: string;
      if (err?.message.includes("denied")) {
        errMsg = "User denied signature";
      } else {
        errMsg = appendError("Failed to submit transfer", err?.message);
      }
      log(errMsg, { error: true });
    })
    .on("transactionHash", (txHash) => {
      setSigning(false);
      setSending(true);
      log(`Transaction submitted (${txHash}), awaiting confirmation...`, {
        url: explorerTxHashUrl(explorerUrl, txHash),
      });
    })
    .on("receipt", (receipt) => {
      log("Transfer complete", {
        url: explorerTxHashUrl(explorerUrl, receipt.transactionHash),
      });
    })
    .finally(() => {
      setSigning(false);
      setSending(false);
    });
}

function performGaslessTransfer(options: {
  signerWeb3: Web3;
  from: string;
  to: string;
  amount: BN;
  gasRelayUrl: string;
  eip712: EIP712Options;
  contractAddress: string;
  explorerUrl: string;
  setSigning: (v: boolean) => void;
  setSending: (v: boolean) => void;
}): void {
  const {
    signerWeb3,
    from,
    to,
    amount,
    gasRelayUrl,
    eip712,
    contractAddress,
    explorerUrl,
    setSigning,
    setSending,
  } = options;

  setSigning(true);
  log("Awaiting signature for transfer authorization...");

  const validAfter = UINT256_MIN;
  const validBefore = UINT256_MAX;
  const nonce = Web3.utils.randomHex(32);

  const eip712Data = makeEIP712Data(
    eip712.useSalt
      ? {
          name: eip712.name,
          version: eip712.version,
          verifyingContract: contractAddress,
          salt: eip712.chainId,
        }
      : {
          name: eip712.name,
          version: eip712.version,
          chainId: eip712.chainId,
          verifyingContract: contractAddress,
        },
    {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    "TransferWithAuthorization",
    {
      from,
      to,
      value: amount.toString(10),
      validAfter,
      validBefore,
      nonce,
    }
  );

  const provider = signerWeb3.currentProvider as Provider;

  provider.sendAsync(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_signTypedData_v3",
      params: [from, eip712Data],
    },
    (err, response) => {
      setSigning(false);

      if (err || !response?.result) {
        let errMsg: string;
        if (err?.message.includes("denied")) {
          errMsg = "User denied signature";
        } else if (err?.message.includes("eth_signTypedData")) {
          errMsg = "EIP-712 is not supported by your Web3 browser";
        } else {
          errMsg = appendError("Failed to obtain signature", err?.message);
        }
        log(errMsg, { error: true });
        return;
      }
      const signature = response.result as string;

      setSending(true);
      log("Transfer authorization signed, submitting to gas relayer...");

      submitAuthorization({
        type: "transfer",
        address1: from,
        address2: to,
        value: amount,
        validAfter,
        validBefore,
        nonce,
        signature,
        gasRelayUrl,
        explorerUrl,
      })
        .then(({ txHash }) => {
          log("Transfer complete", {
            url: explorerTxHashUrl(explorerUrl, txHash),
          });
        })
        .catch((err) => {
          log(err?.message || "Failed to submit transfer authorization", {
            error: true,
          });
        })
        .finally(() => {
          setSending(false);
        });
    }
  );
}
