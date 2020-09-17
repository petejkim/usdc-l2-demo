import React, { useCallback, useState } from "react";
import Web3 from "web3";
import metaMaskLogo from "../images/metamask.svg";
import { Button } from "./Button";
import { HintBubble } from "./HintBubble";
import { Modal } from "./Modal";
import "./RequireWeb3.scss";

declare global {
  interface Window {
    ethereum?: {
      enable?: () => Promise<string[]>;
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
      autoRefreshOnNetworkChange?: boolean;
      networkVersion?: string;
      on?: (evt: string, callback: () => void) => void;
    };
  }
}

if (typeof window.ethereum?.autoRefreshOnNetworkChange === "boolean") {
  window.ethereum.autoRefreshOnNetworkChange = true;
}

export interface RequireWeb3Props {
  onConnect?: (address: string, provider: any) => void;
}

export function RequireWeb3(props: RequireWeb3Props): JSX.Element {
  const { onConnect } = props;

  const [chainId, setChainId] = useState<number | undefined>(undefined);

  const connect = useCallback(() => {
    let accountsPromise: Promise<string[]>;

    if (typeof window?.ethereum?.request === "function") {
      accountsPromise = window.ethereum.request({
        method: "eth_requestAccounts",
      });
    } else if (typeof window?.ethereum?.enable === "function") {
      accountsPromise = window.ethereum.enable();
    } else {
      return;
    }

    void accountsPromise.then((accounts): void => {
      const netVer = Number(window.ethereum?.networkVersion);
      setChainId(netVer);

      if (netVer === 5) {
        const address = Web3.utils.toChecksumAddress(accounts[0]);
        onConnect?.(address, window?.ethereum);
      }
    });
  }, [onConnect]);

  return (
    <Modal className="RequireWeb3" title="Be Advised">
      <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">
        <img src={metaMaskLogo} alt="" />
      </a>

      <p>
        To run this demo, please use a Web3-enabled browser, connected to the
        Görli (Goerli) Test Network.
      </p>

      <p>
        The USDC used in this demo is on the test network and do not have real
        monetary value.
      </p>

      <Button onClick={connect}>Connect</Button>

      {chainId != null && chainId !== 5 && (
        <HintBubble>Please switch to Görli Testnet and try again.</HintBubble>
      )}
    </Modal>
  );
}
