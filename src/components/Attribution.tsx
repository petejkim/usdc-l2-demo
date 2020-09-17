import React from "react";
import ethAlt from "../images/ethereum-alt.svg";
import eth from "../images/ethereum.svg";
import "./Attribution.scss";

export function Attribution(): JSX.Element {
  return (
    <div className="Attribution">
      <ul>
        <li title="Wanna work together? Let me know.">
          Designed and coded with{" "}
          <img className="Attribution-eth" src={eth} alt="♥" />
          <img className="Attribution-eth-alt" src={ethAlt} alt="♥" /> by{" "}
          <a href="https://twitter.com/petejkim">@petejkim</a> in California
        </li>
        <li>
          Powered by <a href="https://matic.network">Matic</a>
        </li>
        <li>
          <a href="https://github.com/petejkim/usdc-l2-demo">Frontend</a>
        </li>
        <li>
          <a href="https://github.com/petejkim/fiat-token-gas-relay">
            Gas Relay
          </a>
        </li>
        <li>
          <a href="https://goerli.etherscan.io/address/0x2f3a40a3db8a7e3d09b0adfefbce4f6f81927557">
            Görli Contract
          </a>
        </li>
        <li>
          <a href="https://mumbai-explorer.matic.today/address/0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747">
            Mumbai Contract
          </a>
        </li>
      </ul>
    </div>
  );
}
