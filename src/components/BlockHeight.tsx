import React, { useEffect, useState } from "react";
import Web3 from "web3";

export interface BlockHeightProps {
  web3: Web3 | null;
  refreshInterval: number;
}

export function BlockHeight(props: BlockHeightProps): JSX.Element {
  const { web3, refreshInterval } = props;
  const [blockHeight, setBlockHeight] = useState<number>(-1);

  useEffect(() => {
    let timer: number;
    let aborted = false;

    const loadBlockHeight = (): void => {
      void web3?.eth.getBlockNumber().then((v) => {
        if (aborted) {
          return;
        }
        setBlockHeight(v);
        timer = window.setTimeout(loadBlockHeight, refreshInterval);
      });
    };

    loadBlockHeight();

    return (): void => {
      aborted = true;
      window.clearTimeout(timer);
    };
  }, [web3, refreshInterval]);

  return <code>{blockHeight >= 0 ? blockHeight : "N/A"}</code>;
}
