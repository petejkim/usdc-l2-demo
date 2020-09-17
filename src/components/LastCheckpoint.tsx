import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { getLastChildBlock } from "../util/withdrawal";

export interface LastCheckpointProps {
  web3: Web3 | null;
  rootChain: string;
  refreshInterval: number;
  initialCheckpoint: number;
  onChange: (checkpoint: number) => void;
}

export function LastCheckpoint(props: LastCheckpointProps): JSX.Element {
  const {
    web3,
    rootChain,
    refreshInterval,
    initialCheckpoint: initialBlockNumber,
    onChange,
  } = props;

  const [checkpoint, setCheckpoint] = useState<string>(
    initialBlockNumber ? String(initialBlockNumber) : "N/A"
  );

  useEffect(() => {
    let timer: number;
    let aborted = false;

    const loadLastChildBlock = (): void => {
      if (!web3) {
        return;
      }

      void getLastChildBlock(web3, rootChain)
        .then((b) => {
          setCheckpoint(String(b));
          onChange(b);
        })
        .finally(() => {
          if (!aborted) {
            timer = window.setTimeout(loadLastChildBlock, refreshInterval);
          }
        });
    };

    loadLastChildBlock();

    return (): void => {
      aborted = true;
      window.clearTimeout(timer);
    };
  }, [web3, rootChain, refreshInterval, onChange]);

  return <code>{checkpoint}</code>;
}
