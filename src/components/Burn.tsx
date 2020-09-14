import BN from "bn.js";
import React, { useCallback, useState } from "react";
import Web3 from "web3";
import spinner from "../images/spinner.svg";
import { Provider } from "../types/Provider";
import { UINT256_MAX, UINT256_MIN, ZERO_ADDRESS } from "../util/constants";
import { EIP712Options, makeEIP712Data } from "../util/eip712";
import { explorerTxHashUrl } from "../util/explorer";
import { submitAuthorization } from "../util/gasRelay";
import { log } from "../util/logger";
import { appendError, bnFromDecimalString } from "../util/types";
import "./Burn.scss";
import { Button } from "./Button";
import { HintBubble } from "./HintBubble";
import { TextField } from "./TextField";

export interface BurnProps {
  signerWeb3: Web3 | null;
  userAddress: string;
  contractAddress: string;
  balance: BN | null;
  decimalPlaces: number;
  gasAbstraction: {
    relayUrl: string;
    eip712: EIP712Options;
  };
  explorerUrl: string;
}

export function Burn(props: BurnProps): JSX.Element {
  const {
    signerWeb3,
    userAddress,
    contractAddress,
    balance,
    decimalPlaces,
    gasAbstraction,
    explorerUrl,
  } = props;

  const [amount, setAmount] = useState<string>("");
  const [signing, setSigning] = useState<boolean>(false);
  const [burning, setBurning] = useState<boolean>(false);

  const changeAmount = useCallback((v: string) => {
    setAmount(v.replace(/[^\d.]/g, "") || "");
  }, []);

  const parsedAmount = bnFromDecimalString(amount, decimalPlaces);

  const burnTokens = useCallback(() => {
    if (!signerWeb3 || !parsedAmount) {
      return;
    }
    performBurn({
      signerWeb3,
      owner: userAddress,
      amount: parsedAmount,
      contractAddress,
      gasRelayUrl: gasAbstraction.relayUrl,
      eip712: gasAbstraction.eip712,
      explorerUrl,
      setSigning,
      setBurning,
    });
  }, [
    signerWeb3,
    userAddress,
    contractAddress,
    gasAbstraction.eip712,
    gasAbstraction.relayUrl,
    explorerUrl,
    parsedAmount,
  ]);

  const amountValid = !!parsedAmount;
  const amountTooBig = !!(balance && parsedAmount?.gt(balance));
  const disableBurn =
    !amount || !amountValid || amountTooBig || signing || burning;

  return (
    <div className="Burn">
      <div className="Burn-amount-field">
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
      {burning && <img className="Burn-spinner" src={spinner} alt="" />}
      <Button disabled={disableBurn} onClick={burnTokens}>
        {signing ? "Confirming..." : burning ? "Burning..." : "Burn"}
      </Button>
    </div>
  );
}

function performBurn(options: {
  signerWeb3: Web3;
  owner: string;
  amount: BN;
  contractAddress: string;
  gasRelayUrl: string;
  eip712: EIP712Options;
  explorerUrl: string;
  setSigning: (v: boolean) => void;
  setBurning: (v: boolean) => void;
}): void {
  const {
    signerWeb3,
    owner,
    amount,
    contractAddress,
    gasRelayUrl,
    eip712,
    explorerUrl,
    setSigning,
    setBurning,
  } = options;

  setSigning(true);
  log("Awaiting signature for burn authorization...");

  const validAfter = UINT256_MIN;
  const validBefore = UINT256_MAX;
  const nonce = Web3.utils.randomHex(32);

  const eip712Data = makeEIP712Data(
    {
      name: eip712.name,
      version: eip712.version,
      verifyingContract: contractAddress,
      salt: eip712.chainId,
    },
    {
      BurnWithAuthorization: [
        { name: "owner", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    "BurnWithAuthorization",
    {
      owner,
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
      params: [owner, eip712Data],
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

      setBurning(true);
      log("Burn authorization signed, submitting to gas relayer...");

      submitAuthorization({
        type: "burn",
        address1: owner,
        address2: ZERO_ADDRESS,
        value: amount,
        validAfter,
        validBefore,
        nonce,
        signature,
        gasRelayUrl,
        explorerUrl,
      })
        .then((txHash) => {
          log(
            "Burn complete. You can claim burned tokens in Layer 1 after the next " +
              "checkpoint is committed in ~30 minutes.",
            { url: explorerTxHashUrl(explorerUrl, txHash) }
          );
        })
        .catch((err) => {
          log(err?.message || "Failed to submit burn authorization", {
            error: true,
          });
        })
        .finally(() => {
          setBurning(false);
        });
    }
  );
}
