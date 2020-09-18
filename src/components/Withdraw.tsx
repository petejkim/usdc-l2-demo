import BN from "bn.js";
import React, { useCallback, useState } from "react";
import Web3 from "web3";
import { Provider } from "../types/Provider";
import { UINT256_MAX, UINT256_MIN, ZERO_ADDRESS } from "../util/constants";
import { EIP712Options, makeEIP712Data } from "../util/eip712";
import { BALANCE_SHOULD_UPDATE_EVENT, events } from "../util/events";
import { explorerTxHashUrl } from "../util/explorer";
import { submitAuthorization } from "../util/gasRelay";
import { log } from "../util/logger";
import { appendError, bnFromDecimalString } from "../util/types";
import { addBurn } from "../util/withdrawal";
import { Button } from "./Button";
import { HintBubble } from "./HintBubble";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";
import { TextField } from "./TextField";
import "./Withdraw.scss";

export interface WithdrawProps {
  signerWeb3: Web3 | null;
  userAddress: string;
  tokenContract: string;
  balance: BN | null;
  decimalPlaces: number;
  gasAbstraction: {
    relayUrl: string;
    eip712: EIP712Options;
  };
  explorerUrl: string;
}

export function Withdraw(props: WithdrawProps): JSX.Element {
  const {
    signerWeb3,
    userAddress,
    tokenContract,
    balance,
    decimalPlaces,
    gasAbstraction,
    explorerUrl,
  } = props;

  const [amount, setAmount] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [signing, setSigning] = useState<boolean>(false);
  const [burning, setBurning] = useState<boolean>(false);

  const changeAmount = useCallback((v: string) => {
    setAmount(v.replace(/[^\d.]/g, "") || "");
  }, []);

  const parsedAmount = bnFromDecimalString(amount, decimalPlaces);

  const clickWithdraw = useCallback(() => {
    setShowModal(true);
  }, []);

  const clickCancel = useCallback(() => {
    setShowModal(false);
  }, []);

  const clickProceed = useCallback(() => {
    setShowModal(false);
    if (!signerWeb3 || !parsedAmount) {
      return;
    }
    performBurn({
      signerWeb3,
      owner: userAddress,
      amount: parsedAmount,
      tokenContract,
      gasRelayUrl: gasAbstraction.relayUrl,
      eip712: gasAbstraction.eip712,
      explorerUrl,
      setSigning,
      setBurning,
    });
  }, [
    signerWeb3,
    userAddress,
    tokenContract,
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
    <>
      <div className="Withdraw">
        <div className="Withdraw-amount-field">
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
        {burning && <Spinner />}
        <Button disabled={disableBurn} onClick={clickWithdraw}>
          {signing ? "Confirming..." : burning ? "Burning..." : "Withdraw"}
        </Button>
      </div>

      {showModal && (
        <Modal className="Withdraw-modal" title="BE ADVISED">
          <p>Withdrawing USDC from L2 to L1 is a two-step process.</p>
          <span className="Withdraw-step">1</span>
          <p>In L2, the USDC tokens you'd like to withdraw are burned.</p>
          <p>
            Every ~30 minutes, a checkpoint containing the latest snapshot of
            the L2 chain state is submitted to L1.
          </p>
          <span className="Withdraw-step">2</span>
          <p>
            In L1, once the checkpoint is available, a merkle proof of the burn
            transaction can be submitted to claim the tokens.
          </p>

          <Button onClick={clickCancel}>Cancel</Button>
          <Button onClick={clickProceed}>Proceed with Burn</Button>
        </Modal>
      )}
    </>
  );
}

function performBurn(options: {
  signerWeb3: Web3;
  owner: string;
  amount: BN;
  tokenContract: string;
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
    tokenContract,
    gasRelayUrl,
    eip712,
    explorerUrl,
    setSigning,
    setBurning,
  } = options;

  setSigning(true);
  log("Requesting your signature to authorize a gasless burn...");

  const validAfter = UINT256_MIN;
  const validBefore = UINT256_MAX;
  const nonce = Web3.utils.randomHex(32);

  const eip712Data = makeEIP712Data(
    {
      name: eip712.name,
      version: eip712.version,
      verifyingContract: tokenContract,
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
        .then(({ txHash, blockNumber }) => {
          addBurn(owner, txHash, blockNumber, amount);
          events.emit(BALANCE_SHOULD_UPDATE_EVENT);
          log(
            `Burn confirmed at ${blockNumber}. You can claim burned tokens in` +
              " Layer 1 after the next checkpoint is committed in ~30 minutes.",
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
