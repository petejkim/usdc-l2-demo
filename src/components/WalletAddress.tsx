import React from "react";
import { useMediaQuery } from "react-responsive";
import { abbreviateHex } from "../util/types";

export interface WalletAddressProps {
  address: string;
}

export function WalletAddress(props: WalletAddressProps): JSX.Element {
  const address = props.address || "0x0000000000000000000000000000000000000000";
  const isSmallScreen = useMediaQuery({
    query: "(max-width: 470px)",
  });

  const displayAddress = isSmallScreen ? abbreviateHex(address) : address;

  return <code className="WalletAddress">{displayAddress}</code>;
}
