import React from "react";
import ethAlt from "../images/ethereum-alt.svg";
import eth from "../images/ethereum.svg";
import "./Attribution.scss";
import { Link } from "./Link";

export function Attribution(): JSX.Element {
  return (
    <div className="Attribution">
      <ul>
        <li title="Wanna work together? Let me know.">
          Designed and coded with{" "}
          <img className="Attribution-eth" src={eth} alt="♥" />
          <img className="Attribution-eth-alt" src={ethAlt} alt="♥" /> by{" "}
          <Link url="https://twitter.com/petejkim" blank>
            @petejkim
          </Link>{" "}
          in California
        </li>
        <li>
          Powered by{" "}
          <Link url="https://matic.network" blank>
            Matic
          </Link>
        </li>
        <li>
          <Link url="https://github.com/petejkim/usdc-l2-demo" blank>
            Frontend
          </Link>
        </li>
        <li>
          <Link url="https://github.com/petejkim/fiat-token-gas-relay" blank>
            Gas Relay
          </Link>
        </li>
        <li>
          <Link url="https://github.com/centrehq/centre-tokens" blank>
            USDC v2
          </Link>
        </li>
        <li>
          <Link
            url="https://goerli.etherscan.io/address/0x2f3a40a3db8a7e3d09b0adfefbce4f6f81927557"
            blank
          >
            Görli Contract
          </Link>
        </li>
        <li>
          <Link
            url="https://mumbai-explorer.matic.today/address/0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747"
            blank
          >
            Mumbai Contract
          </Link>
        </li>
      </ul>
    </div>
  );
}
