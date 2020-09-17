import React from "react";
import { Button } from "./Button";
import "./L1Notice.scss";
import { Panel } from "./Panel";

export function L1Notice(): JSX.Element {
  return (
    <Panel className="L1Notice" title="Görli Test Ether Required ">
      <p>
        Gasless transactions are not implemented for Layer 1 (Görli Testnet) in
        this demo.
      </p>
      <p>
        Please obtain free Görli ETH from these faucets to perform transactions
        in Layer 1:
        <br />
        <Button small href="https://goerli-faucet.slock.it/">
          Simple Faucet
        </Button>
        <Button small href="https://faucet.goerli.mudit.blog/">
          Authenticated Faucet
        </Button>
      </p>
    </Panel>
  );
}
