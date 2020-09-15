import React, { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import { events } from "../util/events";
import { explorerTxHashUrl } from "../util/explorer";
import { log } from "../util/logger";
import {
  abbreviateHex,
  appendError,
  decimalStringFromBN,
  strip0x,
} from "../util/types";
import {
  BurnTx,
  getDataForExit,
  loadBurns,
  removeBurn,
} from "../util/withdrawal";
import { Button } from "./Button";
import "./ClaimWithdrawal.scss";
import { Spinner } from "./Spinner";

const EXIT_SELECTOR = "0x3805550f";
const BURN_REMOVED_EVENT = "burn-removed";

export interface ClaimWithdrawalProps {
  web3: Web3 | null;
  web3L2: Web3;
  userAddress: string;
  rootChain: string;
  posRootChainManager: string;
  decimalPlaces: number;
  explorerUrl: string;
  explorerUrlL2: string;
  checkpoint: number;
}

export function ClaimWithdrawal(props: ClaimWithdrawalProps): JSX.Element {
  const {
    web3,
    web3L2,
    userAddress,
    rootChain,
    posRootChainManager,
    decimalPlaces,
    explorerUrl,
    explorerUrlL2,
    checkpoint,
  } = props;
  const [burns, setBurns] = useState<BurnTx[]>([]);

  const reloadBurns = useCallback(() => {
    setBurns(loadBurns());
  }, []);

  useEffect(() => {
    reloadBurns();
    events.on(BURN_REMOVED_EVENT, reloadBurns);
    return (): void => {
      events.off(BURN_REMOVED_EVENT, reloadBurns);
    };
  }, [reloadBurns]);

  return (
    <div className="ClaimWithdrawal">
      {burns.length === 0 ? (
        "Withdrawals not found"
      ) : (
        <table>
          <thead>
            <tr>
              <th className="Withdrawal-tx-hash">L2 Burn Tx</th>
              <th className="Withdrawal-block">L2 Block</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {web3 &&
              burns.map((burnTx) => (
                <Withdrawal
                  key={burnTx.txHash}
                  web3={web3}
                  web3L2={web3L2}
                  userAddress={userAddress}
                  rootChain={rootChain}
                  posRootChainManager={posRootChainManager}
                  decimalPlaces={decimalPlaces}
                  explorerUrl={explorerUrl}
                  explorerUrlL2={explorerUrlL2}
                  burnTx={burnTx}
                  checkpoint={checkpoint}
                />
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export interface WithdrawalProps {
  web3: Web3;
  web3L2: Web3;
  userAddress: string;
  rootChain: string;
  posRootChainManager: string;
  decimalPlaces: number;
  explorerUrl: string;
  explorerUrlL2: string;
  burnTx: BurnTx;
  checkpoint: number;
}

enum WithdrawalState {
  DEFAULT = "DEFAULT",
  GETTING_DATA = "GETTING_DATA",
  SIGNING = "SIGNING",
  CLAIMING = "CLAIMING",
}

export function Withdrawal(props: WithdrawalProps): JSX.Element {
  const {
    web3,
    web3L2,
    userAddress,
    rootChain,
    posRootChainManager,
    decimalPlaces,
    explorerUrl,
    explorerUrlL2,
    burnTx,
    checkpoint,
  } = props;

  const { txHash } = burnTx;
  const [state, setState] = useState<WithdrawalState>(WithdrawalState.DEFAULT);

  const claim = useCallback(() => {
    void performExit(
      txHash,
      web3,
      web3L2,
      userAddress,
      rootChain,
      posRootChainManager,
      explorerUrl,
      setState
    );
  }, [
    web3,
    web3L2,
    userAddress,
    rootChain,
    posRootChainManager,
    explorerUrl,
    txHash,
  ]);

  const claimDisabled = state !== WithdrawalState.DEFAULT;

  return (
    <tr className="Withdrawal">
      <td className="Withdrawal-tx-hash">
        <a
          href={explorerTxHashUrl(explorerUrlL2, txHash)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <code title={txHash}>{abbreviateHex(txHash)}</code>
        </a>
      </td>
      <td className="Withdrawal-block">
        <code>{burnTx.blockNumber}</code>
      </td>
      <td>
        <code>{decimalStringFromBN(burnTx.amount, decimalPlaces)}</code>
      </td>
      <td className="Withdrawal-claim">
        {(state === WithdrawalState.GETTING_DATA ||
          state === WithdrawalState.CLAIMING) && <Spinner />}
        {burnTx.blockNumber <= checkpoint ? (
          <Button onClick={claim} disabled={claimDisabled}>
            {state === WithdrawalState.GETTING_DATA
              ? "Loading..."
              : state === WithdrawalState.SIGNING
              ? "Signing..."
              : state === WithdrawalState.CLAIMING
              ? "Claiming..."
              : "Claim"}
          </Button>
        ) : (
          <Button title="Awaiting checkpoint..." disabled>
            Pending
          </Button>
        )}
      </td>
    </tr>
  );
}

async function performExit(
  burnTxHash: string,
  web3: Web3,
  web3L2: Web3,
  userAddress: string,
  rootChain: string,
  posRootChainManager: string,
  explorerUrl: string,
  setState: (state: WithdrawalState) => void
): Promise<void> {
  setState(WithdrawalState.GETTING_DATA);
  log(`Generating merkle proof for the burn transaction ${burnTxHash}...`);

  const data = await getDataForExit(burnTxHash, web3, web3L2, rootChain);

  setState(WithdrawalState.SIGNING);
  log("Awaiting signature to claim withdrawal...");

  web3.eth
    .sendTransaction({
      from: userAddress,
      to: posRootChainManager,
      data:
        EXIT_SELECTOR +
        strip0x(web3.eth.abi.encodeParameters(["bytes"], [data])),
    })
    .on("error", (err) => {
      let errMsg: string;
      if (err?.message.includes("denied")) {
        errMsg = "User denied signature";
      } else {
        errMsg = appendError(
          "Failed to submit claim transaction",
          err?.message
        );
      }
      log(errMsg, { error: true });
    })
    .on("transactionHash", (claimTxHash) => {
      setState(WithdrawalState.CLAIMING);
      removeBurn(burnTxHash);
      log(`Transaction submitted (${claimTxHash}), awaiting confirmation...`, {
        url: explorerTxHashUrl(explorerUrl, claimTxHash),
      });
    })
    .on("receipt", (receipt) => {
      events.emit(BURN_REMOVED_EVENT);
      log("Claim complete", {
        url: explorerTxHashUrl(explorerUrl, receipt.transactionHash),
      });
    })
    .finally(() => {
      setState(WithdrawalState.DEFAULT);
    });
}
