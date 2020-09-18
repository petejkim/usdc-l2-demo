import BN from "bn.js";
import React, { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import { Provider } from "../types/Provider";
import { UINT256_MAX, UINT256_MIN } from "../util/constants";
import { EIP712Options, makeEIP712Data } from "../util/eip712";
import { BALANCE_SHOULD_UPDATE_EVENT, events } from "../util/events";
import { explorerTxHashUrl } from "../util/explorer";
import { submitAuthorization } from "../util/gasRelay";
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
  signerWeb3: Web3 | null;
  userAddress: string;
  tokenContract: string;
  tokenFaucet?: string;
  decimalPlaces: number;
  refreshInterval: number;
  initialBalance: BN | null;
  gasAbstraction?: {
    relayUrl: string;
    eip712: EIP712Options;
  };
  explorerUrl: string;
  onChange: (balance: BN) => void;
}

export function TokenBalance(props: TokenBalanceProps): JSX.Element {
  const {
    web3,
    signerWeb3,
    userAddress,
    tokenContract,
    tokenFaucet,
    decimalPlaces,
    refreshInterval,
    initialBalance,
    gasAbstraction,
    explorerUrl,
    onChange,
  } = props;

  const [balance, setBalance] = useState<string>(
    initialBalance ? decimalStringFromBN(initialBalance, decimalPlaces) : "N/A"
  );
  const [showModal, setShowModal] = useState<boolean>(false);
  const [state, setState] = useState<ClaimState>(ClaimState.DEFAULT);

  const reloadBalance = useCallback(async () => {
    if (!web3 || !userAddress) {
      return;
    }

    const data =
      BALANCE_OF_SELECTOR +
      strip0x(web3.eth.abi.encodeParameters(["address"], [userAddress]));

    const balanceHex = await web3.eth.call(
      {
        from: userAddress,
        to: tokenContract,
        data,
      },
      "latest"
    );
    const balanceBN = web3.utils.toBN(balanceHex);
    setBalance(decimalStringFromBN(balanceBN, decimalPlaces));
    onChange(balanceBN);
  }, [web3, userAddress, tokenContract, decimalPlaces, onChange]);

  useEffect(() => {
    let timer: number;
    let aborted = false;

    const loadTokenBalance = async (): Promise<void> => {
      window.clearTimeout(timer);

      try {
        await reloadBalance();
      } finally {
        if (!aborted) {
          timer = window.setTimeout(loadTokenBalance, refreshInterval);
        }
      }
    };

    void loadTokenBalance();

    return (): void => {
      aborted = true;
      window.clearTimeout(timer);
    };
  }, [reloadBalance, refreshInterval]);

  useEffect(() => {
    void reloadBalance();
    events.on(BALANCE_SHOULD_UPDATE_EVENT, reloadBalance);
    return (): void => {
      events.off(BALANCE_SHOULD_UPDATE_EVENT, reloadBalance);
    };
  }, [reloadBalance]);

  const clickGiveMe = useCallback(() => {
    if (!web3) {
      return;
    }

    if (tokenFaucet) {
      void performClaim({
        web3,
        userAddress,
        tokenFaucet,
        explorerUrl,
        setShowModal,
        setState,
      });
    }

    if (signerWeb3 && gasAbstraction) {
      void performGaslessClaim({
        web3,
        signerWeb3,
        userAddress,
        tokenContract,
        gasRelayUrl: gasAbstraction.relayUrl,
        eip712: gasAbstraction.eip712,
        explorerUrl,
        setShowModal,
        setState,
      });
    }
  }, [
    web3,
    signerWeb3,
    userAddress,
    tokenFaucet,
    tokenContract,
    gasAbstraction,
    explorerUrl,
  ]);

  const clickUnderstood = useCallback(() => {
    setShowModal(false);
  }, []);

  const giveMeDisabled = state !== ClaimState.DEFAULT;

  return (
    <>
      <div className="TokenBalance">
        <code>{balance}</code>
        {state === ClaimState.CLAIMING && <Spinner small />}
        {(tokenFaucet || gasAbstraction) && (
          <Button small onClick={clickGiveMe} disabled={giveMeDisabled}>
            {state === ClaimState.CLAIMING
              ? "Claiming..."
              : state === ClaimState.SIGNING
              ? "Signing..."
              : "Give me some"}
          </Button>
        )}
      </div>

      {showModal && (
        <Modal className="TokenBalance-cantClaim" title="SINCERE APOLOGIES">
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

  const canClaim = await checkCanClaim(web3, userAddress, tokenFaucet);

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
        events.emit(BALANCE_SHOULD_UPDATE_EVENT);
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

async function performGaslessClaim(params: {
  web3: Web3;
  signerWeb3: Web3;
  userAddress: string;
  tokenContract: string;
  gasRelayUrl: string;
  eip712: EIP712Options;
  explorerUrl: string;
  setShowModal: (v: boolean) => void;
  setState: (v: ClaimState) => void;
}): Promise<void> {
  const {
    web3,
    signerWeb3,
    userAddress,
    tokenContract,
    gasRelayUrl,
    eip712,
    explorerUrl,
    setShowModal,
    setState,
  } = params;

  setState(ClaimState.SIGNING);

  const canClaim = await checkCanClaim(web3, userAddress, tokenContract);

  if (!canClaim) {
    setState(ClaimState.DEFAULT);
    setShowModal(true);
    return;
  }

  log(
    "Requesting your signature to obtain tokens from the faucet contract gaslessly..."
  );

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
      ClaimWithAuthorization: [
        { name: "owner", type: "address" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    "ClaimWithAuthorization",
    {
      owner: userAddress,
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
      params: [userAddress, eip712Data],
    },
    (err, response) => {
      setState(ClaimState.DEFAULT);

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

      setState(ClaimState.CLAIMING);
      log("Claim authorization signed, submitting to gas relayer...");

      submitAuthorization({
        type: "claim",
        address1: userAddress,
        address2: userAddress,
        value: new BN(0),
        validAfter,
        validBefore,
        nonce,
        signature,
        gasRelayUrl,
        explorerUrl,
      })
        .then(({ txHash }) => {
          events.emit(BALANCE_SHOULD_UPDATE_EVENT);
          log("Received USDC tokens from the faucet contract.", {
            url: explorerTxHashUrl(explorerUrl, txHash),
          });
        })
        .catch((err) => {
          log(err?.message || "Failed to submit claim authorization", {
            error: true,
          });
        })
        .finally(() => {
          setState(ClaimState.DEFAULT);
        });
    }
  );
}

async function checkCanClaim(
  web3: Web3,
  userAddress: string,
  contract: string
): Promise<boolean> {
  const canClaimCallData =
    CAN_CLAIM_SELECTOR +
    strip0x(web3.eth.abi.encodeParameters(["address"], [userAddress]));

  const canClaimHex = await web3.eth.call(
    {
      from: userAddress,
      to: contract,
      data: canClaimCallData,
    },
    "latest"
  );

  return canClaimHex.slice(-1) === "1";
}
