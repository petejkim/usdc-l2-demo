import React, { useCallback, useState } from "react";
import metaMaskLogo from "../images/metamask.svg";
import { Button } from "./Button";
import { HintBubble } from "./HintBubble";
import { Panel } from "./Panel";
import "./RequireWeb3.scss";

declare global {
  interface Window {
    ethereum?: {
      enable?: () => Promise<string[]>;
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
      autoRefreshOnNetworkChange?: boolean;
      networkVersion?: string;
    };
  }
}

if (typeof window.ethereum?.autoRefreshOnNetworkChange === "boolean") {
  window.ethereum.autoRefreshOnNetworkChange = true;
}

export interface RequireWeb3Props {
  onConnect?: (account: string, provider: any) => void;
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
        onConnect?.(accounts[0], window?.ethereum);
      }
    });
  }, [onConnect]);

  return (
    <div className="RequireWeb3">
      <div className="RequireWeb3-backdrop" />
      <div className="RequireWeb3-container">
        <Panel title="Be Advised">
          <img src={metaMaskLogo} alt="" />

          <p>
            To run this demo, please use a Web3-enabled browser connected to the
            Görli (Goerli) Test Network.
          </p>

          <Button onClick={connect}>Connect</Button>

          {chainId != null && chainId !== 5 && (
            <HintBubble>
              Please switch to Görli Testnet and try again.
            </HintBubble>
          )}
        </Panel>
      </div>
    </div>
  );
}
