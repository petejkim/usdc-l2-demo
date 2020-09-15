import BN from "bn.js";
import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { decimalStringFromBN, strip0x } from "../util/types";

const BALANCE_OF_SELECTOR = "0x70a08231";

export interface TokenBalanceProps {
  web3: Web3 | null;
  userAddress: string;
  contractAddress: string;
  decimalPlaces: number;
  refreshInterval: number;
  initialBalance: BN | null;
  onChange: (balance: BN) => void;
}

export function TokenBalance(props: TokenBalanceProps): JSX.Element {
  const {
    web3,
    userAddress,
    contractAddress,
    decimalPlaces,
    refreshInterval,
    initialBalance,
    onChange,
  } = props;

  const [balance, setBalance] = useState<string>(
    initialBalance ? decimalStringFromBN(initialBalance, decimalPlaces) : "N/A"
  );

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
            to: contractAddress,
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
    contractAddress,
    decimalPlaces,
    refreshInterval,
    onChange,
  ]);

  return <code>{balance}</code>;
}
