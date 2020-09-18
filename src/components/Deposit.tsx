import BN from "bn.js";
import React, { useCallback, useState } from "react";
import Web3 from "web3";
import { UINT256_MAX } from "../util/constants";
import { BALANCE_SHOULD_UPDATE_EVENT, events } from "../util/events";
import { explorerTxHashUrl } from "../util/explorer";
import { log } from "../util/logger";
import {
  appendError,
  bnFromDecimalString,
  bnFromHexString,
  strip0x,
} from "../util/types";
import { Button } from "./Button";
import "./Deposit.scss";
import { HintBubble } from "./HintBubble";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";
import { TextField } from "./TextField";

const ALLOWANCE_SELECTOR = "0xdd62ed3e";
const APPROVE_SELECTOR = "0x095ea7b3";
const DEPOSIT_FOR_SELECTOR = "0xe3dec8fb";

enum DepositState {
  DEFAULT = "DEFAULT",
  SIGNING = "SIGNING",
  APPROVING = "APPROVING",
  DEPOSITING = "DEPOSITING",
}

export interface DepositProps {
  web3: Web3 | null;
  userAddress: string;
  tokenContract: string;
  posRootChainManager: string;
  posERC20Predicate: string;
  balance: BN | null;
  decimalPlaces: number;
  explorerUrl: string;
}

export function Deposit(props: DepositProps): JSX.Element {
  const {
    web3,
    userAddress,
    tokenContract,
    posRootChainManager,
    posERC20Predicate,
    balance,
    decimalPlaces,
    explorerUrl,
  } = props;

  const [amount, setAmount] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [state, setState] = useState<DepositState>(DepositState.DEFAULT);

  const changeAmount = useCallback((v: string) => {
    setAmount(v.replace(/[^\d.]/g, "") || "");
  }, []);

  const parsedAmount = bnFromDecimalString(amount, decimalPlaces);

  const clickDeposit = useCallback(() => {
    setShowModal(true);
  }, []);

  const clickCancel = useCallback(() => {
    setShowModal(false);
  }, []);

  const clickProceed = useCallback(() => {
    setShowModal(false);
    if (!web3 || !parsedAmount) {
      return;
    }
    void performDeposit({
      web3,
      owner: userAddress,
      tokenContract,
      amount: parsedAmount,
      posRootChainManager,
      posERC20Predicate,
      explorerUrl,
      setState,
    });
  }, [
    web3,
    userAddress,
    tokenContract,
    posRootChainManager,
    posERC20Predicate,
    explorerUrl,
    parsedAmount,
  ]);

  const amountValid = !!parsedAmount;
  const amountTooBig = !!(balance && parsedAmount?.gt(balance));
  const depositDisabled =
    !amount || !amountValid || amountTooBig || state !== DepositState.DEFAULT;

  return (
    <>
      <div className="Deposit">
        <div className="Deposit-amount-field">
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
        {(state === DepositState.APPROVING ||
          state === DepositState.DEPOSITING) && <Spinner />}
        <Button disabled={depositDisabled} onClick={clickDeposit}>
          {state === DepositState.SIGNING
            ? "Confirming..."
            : state === DepositState.APPROVING
            ? "Approving..."
            : state === DepositState.DEPOSITING
            ? "Depositing..."
            : "Deposit"}
        </Button>
      </div>

      {showModal && (
        <Modal className="Deposit-modal" title="BE ADVISED">
          <p>
            After your deposit transaction is confirmed in L1, your token
            balance in L2 will be updated in about 5 to 8 minutes, once the
            validators in the L2 PoS consensus layer confirm your deposit.
          </p>
          <Button onClick={clickCancel}>Cancel</Button>
          <Button onClick={clickProceed}>Proceed with Deposit</Button>
        </Modal>
      )}
    </>
  );
}

async function performDeposit(params: {
  web3: Web3;
  owner: string;
  tokenContract: string;
  amount: BN;
  posRootChainManager: string;
  posERC20Predicate: string;
  explorerUrl: string;
  setState: (state: DepositState) => void;
}): Promise<void> {
  const {
    web3,
    owner,
    tokenContract,
    amount,
    posRootChainManager,
    posERC20Predicate,
    explorerUrl,
    setState,
  } = params;

  setState(DepositState.SIGNING);

  const allowanceCallData =
    ALLOWANCE_SELECTOR +
    strip0x(
      web3.eth.abi.encodeParameters(
        ["address", "address"],
        [owner, posERC20Predicate]
      )
    );

  const allowanceHex = await web3.eth.call(
    {
      from: owner,
      to: tokenContract,
      data: allowanceCallData,
    },
    "latest"
  );

  const allowance = bnFromHexString(allowanceHex);
  if (allowance.lt(amount)) {
    log(
      "Requesting your signature to allow the deposit contract to transfer your USDC..."
    );

    const approveCallData =
      APPROVE_SELECTOR +
      strip0x(
        web3.eth.abi.encodeParameters(
          ["address", "uint256"],
          [posERC20Predicate, UINT256_MAX]
        )
      );

    try {
      await web3.eth
        .sendTransaction({
          from: owner,
          to: tokenContract,
          data: approveCallData,
        })
        .on("transactionHash", (txHash) => {
          setState(DepositState.APPROVING);
          log(
            `Approval transaction submitted (${txHash}), awaiting confirmation...`,
            { url: explorerTxHashUrl(explorerUrl, txHash) }
          );
        })
        .on("receipt", (receipt) => {
          log("Approval granted", {
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
      setState(DepositState.DEFAULT);
      return;
    }
  }

  setState(DepositState.SIGNING);

  log("Requesting your signature for a deposit transaction...");

  const depositCallData =
    DEPOSIT_FOR_SELECTOR +
    strip0x(
      web3.eth.abi.encodeParameters(
        ["address", "address", "bytes"],
        [owner, tokenContract, web3.eth.abi.encodeParameter("uint256", amount)]
      )
    );

  try {
    await web3.eth
      .sendTransaction({
        from: owner,
        to: posRootChainManager,
        data: depositCallData,
      })
      .on("transactionHash", (txHash) => {
        setState(DepositState.DEPOSITING);
        log(
          `Deposit transaction submitted (${txHash}), awaiting confirmation...`,
          { url: explorerTxHashUrl(explorerUrl, txHash) }
        );
      })
      .on("receipt", (receipt) => {
        events.emit(BALANCE_SHOULD_UPDATE_EVENT);
        log(
          `Deposit confirmed at ${receipt.blockNumber}. The deposited funds ` +
            "will be made available in L2 in approximately 5 to 8 minutes.",
          { url: explorerTxHashUrl(explorerUrl, receipt.transactionHash) }
        );
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
    setState(DepositState.DEFAULT);
  }
}
