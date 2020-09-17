import BN from "bn.js";
import React, { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import { explorerTxHashUrl } from "../util/explorer";
import { log } from "../util/logger";
import { appendError, decimalStringFromBN, strip0x } from "../util/types";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";
import "./TokenBalance.scss";

const BALANCE_OF_SELECTOR = "0x70a08231";
const CAN_CLAIM_SELECTOR = "0xbf3506c1";
const CLAIM_SELETOR = "0x4e71d92d";

enum ClaimState {
  DEFAULT = "DEFAULT",
  SIGNING = "SIGNING",
  CLAIMING = "CLAIMING",
}

export interface TokenBalanceProps {
  web3: Web3 | null;
  userAddress: string;
  tokenContract: string;
  tokenFaucet: string;
  decimalPlaces: number;
  refreshInterval: number;
  initialBalance: BN | null;
  explorerUrl: string;
  onChange: (balance: BN) => void;
}

export function TokenBalance(props: TokenBalanceProps): JSX.Element {
  const {
    web3,
    userAddress,
    tokenContract,
    tokenFaucet,
    decimalPlaces,
    refreshInterval,
    initialBalance,
    explorerUrl,
    onChange,
  } = props;

  const [balance, setBalance] = useState<string>(
    initialBalance ? decimalStringFromBN(initialBalance, decimalPlaces) : "N/A"
  );
  const [showModal, setShowModal] = useState<boolean>(false);
  const [state, setState] = useState<ClaimState>(ClaimState.DEFAULT);

  useEffect(() => {
    let timer: number;
    let aborted = false;

    const loadTokenBalance = (): void => {
      if (!web3 || !userAddress) {
        return;
      }

      const data =
        BALANCE_OF_SELECTOR +
        strip0x(web3.eth.abi.encodeParameters(["address"], [userAddress]));

      void web3.eth
        .call(
          {
            from: userAddress,
            to: tokenContract,
            data,
          },
          "latest"
        )
        .then((v) => {
          if (aborted) {
            return;
          }
          timer = window.setTimeout(loadTokenBalance, refreshInterval);
          const balanceBN = web3.utils.toBN(v);
          setBalance(decimalStringFromBN(balanceBN, decimalPlaces));
          onChange(balanceBN);
        });
    };

    loadTokenBalance();

    return (): void => {
      aborted = true;
      window.clearTimeout(timer);
    };
  }, [
    web3,
    userAddress,
    tokenContract,
    decimalPlaces,
    refreshInterval,
    onChange,
  ]);

  const clickGiveMe = useCallback(() => {
    if (!web3) {
      return;
    }
    void performClaim({
      web3,
      userAddress,
      tokenFaucet,
      explorerUrl,
      setShowModal,
      setState,
    });
  }, [web3, userAddress, tokenFaucet, explorerUrl]);

  const clickUnderstood = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <>
      <div className="TokenBalance">
        <code>{balance}</code>
        {state === ClaimState.CLAIMING && <Spinner small />}
        {tokenFaucet && (
          <Button small onClick={clickGiveMe}>
            {state === ClaimState.CLAIMING
              ? "Claiming..."
              : state === ClaimState.SIGNING
              ? "Signing..."
              : "Give me some"}
          </Button>
        )}
      </div>

      {showModal && (
        <Modal className="TokenBalance-cantClaim" title="Sincere Apologies">
          <p>
            You are trying to obtain tokens again again too quickly. Please wait
            an hour between every claim.
          </p>
          <Button onClick={clickUnderstood}>Understood</Button>
        </Modal>
      )}
    </>
  );
}

async function performClaim(params: {
  web3: Web3;
  userAddress: string;
  tokenFaucet: string;
  explorerUrl: string;
  setShowModal: (v: boolean) => void;
  setState: (v: ClaimState) => void;
}): Promise<void> {
  const {
    web3,
    userAddress,
    tokenFaucet,
    explorerUrl,
    setShowModal,
    setState,
  } = params;

  setState(ClaimState.SIGNING);

  const canClaimCallData =
    CAN_CLAIM_SELECTOR +
    strip0x(web3.eth.abi.encodeParameters(["address"], [userAddress]));

  const canClaimHex = await web3.eth.call(
    {
      from: userAddress,
      to: tokenFaucet,
      data: canClaimCallData,
    },
    "latest"
  );
  const canClaim = canClaimHex.slice(-1) === "1";

  if (!canClaim) {
    setState(ClaimState.DEFAULT);
    setShowModal(true);
    return;
  }

  log("Requesting your signature to obtain tokens from the faucet contract...");

  try {
    await web3.eth
      .sendTransaction({
        from: userAddress,
        to: tokenFaucet,
        data: CLAIM_SELETOR,
      })
      .on("transactionHash", (txHash) => {
        setState(ClaimState.CLAIMING);
        log(
          `Faucet transaction submitted (${txHash}), awaiting confirmation...`,
          { url: explorerTxHashUrl(explorerUrl, txHash) }
        );
      })
      .on("receipt", (receipt) => {
        log("Received USDC tokens from the faucet contract.", {
          url: explorerTxHashUrl(explorerUrl, receipt.transactionHash),
        });
      });
  } catch (err) {
    let errMsg: string;
    if (err?.message.includes("denied")) {
      errMsg = "User denied signature";
    } else {
      errMsg = appendError(
        "Failed to submit an approval transaction",
        err?.message
      );
    }
    log(errMsg, { error: true });
  } finally {
    setState(ClaimState.DEFAULT);
  }
}
