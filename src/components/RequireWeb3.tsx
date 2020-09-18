import React, { useCallback, useState } from "react";
import Web3 from "web3";
import metaMaskLogo from "../images/metamask.svg";
import { JSONRPCRequest, JSONRPCResponse } from "../types/Provider";
import { Button } from "./Button";
import { HintBubble } from "./HintBubble";
import { Link } from "./Link";
import { Modal } from "./Modal";
import "./RequireWeb3.scss";

declare global {
  interface Window {
    ethereum?: {
      enable: () => Promise<string[]>;
      sendAsync: (
        req: JSONRPCRequest,
        callback: (err: Error, res: JSONRPCResponse) => void
      ) => void;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      autoRefreshOnNetworkChange: boolean;
      on?: (evt: string, callback: () => void) => void;
    };
  }
}

if (typeof window.ethereum?.autoRefreshOnNetworkChange === "boolean") {
  window.ethereum.autoRefreshOnNetworkChange = true;
}

export interface RequireWeb3Props {
  onConnect: (address: string, provider: any) => void;
}

export function RequireWeb3(props: RequireWeb3Props): JSX.Element {
  const { onConnect } = props;

  const [hint, setHint] = useState<string>("");

  const clickConnect = useCallback(() => {
    void connect(onConnect, setHint);
  }, [onConnect, setHint]);

  return (
    <Modal className="RequireWeb3" title="BE ADVISED">
      <img src={metaMaskLogo} alt="" />

      <p>
        To run this demo, please use a Web3-enabled browser, such as{" "}
        <Link url="https://metamask.io/" blank>
          MetaMask,{" "}
        </Link>
        connected to the Görli (Goerli) Test Network.
      </p>

      <p>
        The USDC v2 smart contract used in this demo is on the test network and
        its tokens do not have real monetary value.
      </p>

      <Button onClick={clickConnect}>Connect</Button>

      {hint && <HintBubble>{hint}</HintBubble>}
    </Modal>
  );
}

async function connect(
  onConnect: (address: string, provider: any) => void,
  setHint: (message: string) => void
): Promise<void> {
  const { ethereum } = window;
  if (!ethereum) {
    setHint("You aren't running a Web3-enabled browser.");
    return;
  }

  const accounts = await ethereum.enable();

  ethereum.sendAsync(
    {
      method: "net_version",
      params: [],
      jsonrpc: "2.0",
      id: 1,
    },
    (err, resp) => {
      if (err) {
        setHint(err.message);
        return;
      }

      const netVersion = Number(resp?.result);

      if (netVersion !== 5) {
        setHint("Please switch to Görli Testnet and try again.");
        return;
      }

      onConnect(Web3.utils.toChecksumAddress(accounts[0]), ethereum);
    }
  );
}
