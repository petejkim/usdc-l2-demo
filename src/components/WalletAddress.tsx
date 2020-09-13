import React from "react";
import { useMediaQuery } from "react-responsive";

export interface WalletAddressProps {
  address: string;
}

export function WalletAddress(props: WalletAddressProps): JSX.Element {
  const address = props.address || "0x0000000000000000000000000000000000000000";
  const isSmallScreen = useMediaQuery({
    query: "only screen (max-width: 470px)",
  });

  const displayAddress = isSmallScreen
    ? `${address.slice(0, 6)}⋯${address.slice(-4)}`
    : address;

  return <code className="WalletAddress">{displayAddress}</code>;
}
