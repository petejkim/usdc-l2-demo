import BN from "bn.js";
import React, { useCallback, useState } from "react";
import { Box, Flex } from "reflexbox";
import Web3 from "web3";
import {
  L1_CONTRACT_ADDRESS,
  L2_CONTRACT_ADDRESS,
  L2_JSON_RPC_URL,
} from "../config";
import { Attribution } from "./Attribution";
import { BlockHeight } from "./BlockHeight";
import { ClicheVisualization } from "./ClicheVisualization";
import { Clock } from "./Clock";
import "./Main.scss";
import { Panel } from "./Panel";
import { RequireWeb3 } from "./RequireWeb3";
import { TabBar, TabId } from "./TabBar";
import { TokenBalance } from "./TokenBalance";

const L1_REFRESH_INTERVAL = 7000;
const L2_REFRESH_INTERVAL = 1000;

const web3L2 = new Web3(new Web3.providers.HttpProvider(L2_JSON_RPC_URL));

export function Main(): JSX.Element {
  const [userAddress, setUserAddress] = useState<string>("");
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [activeLayer, setActiveLayer] = useState<1 | 2>(2);
  const [balanceL1, setBalanceL1] = useState<BN | null>(null);
  const [balanceL2, setBalanceL2] = useState<BN | null>(null);

  const checkConnection = useCallback(
    (address: string, provider: any): void => {
      if (address) {
        setUserAddress(address);
        setWeb3(new Web3(provider));
      }
    },
    [setUserAddress, setWeb3]
  );

  const selectLayer = useCallback((tabId: TabId) => {
    setActiveLayer(tabId);
  }, []);

  const balanceL1Change = useCallback((balance: BN) => {
    setBalanceL1(balance);
  }, []);

  const balanceL2Change = useCallback((balance: BN) => {
    setBalanceL2(balance);
  }, []);

  return (
    <Flex
      className="Main"
      flexDirection="column"
      maxWidth={1400}
      marginX="auto"
    >
      <Flex
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="space-evenly"
        alignItems="center"
        marginX={12}
        marginY={0}
      >
        <Box flex={1} margin={12} minWidth="auto">
          <Panel title="Wallet Address">
            <code>
              {userAddress || "0x0000000000000000000000000000000000000000"}
            </code>
          </Panel>
        </Box>
        <Box flex={1} margin={12} minWidth="auto">
          <Panel title="L1 / Görli Block Height">
            <BlockHeight web3={web3} refreshInterval={L1_REFRESH_INTERVAL} />
          </Panel>
        </Box>
        <Box flex={1} margin={12} minWidth="auto">
          <Panel title="L2 / Mumbai Block Height">
            <BlockHeight web3={web3L2} refreshInterval={L2_REFRESH_INTERVAL} />
          </Panel>
        </Box>
        <Box flexShrink={0} margin={12}>
          <Clock />
        </Box>
      </Flex>

      <Box marginX={24}>
        <TabBar selected={activeLayer} onSelect={selectLayer} />
      </Box>

      <Flex
        justifyContent="space-evenly"
        flexWrap="wrap"
        marginX={12}
        marginY={0}
      >
        <Flex flex={1} marginX={12} flexDirection="column" minWidth="auto">
          <Box flex={1} marginY={12} minWidth="auto">
            <Panel title="USDC Balance">
              {activeLayer === 1 ? (
                <TokenBalance
                  key={1}
                  web3={web3}
                  userAddress={userAddress}
                  contractAddress={L1_CONTRACT_ADDRESS}
                  decimalPlaces={6}
                  refreshInterval={L1_REFRESH_INTERVAL}
                  initialBalance={balanceL1}
                  onChange={balanceL1Change}
                />
              ) : (
                <TokenBalance
                  key={2}
                  web3={web3L2}
                  userAddress={userAddress}
                  contractAddress={L2_CONTRACT_ADDRESS}
                  decimalPlaces={6}
                  refreshInterval={L2_REFRESH_INTERVAL}
                  initialBalance={balanceL2}
                  onChange={balanceL2Change}
                />
              )}
            </Panel>
          </Box>
          <Box flex={1} marginY={12} minWidth="auto">
            <Panel title="Transfer USDC"></Panel>
          </Box>
          <Box flex={1} marginY={12} minWidth="auto">
            <Panel
              title={
                activeLayer === 1 ? "Upload USDC to L2" : "Download USDC to L1"
              }
            ></Panel>
          </Box>
        </Flex>
        <Flex flex={1} marginX={12} flexDirection="column" minWidth="auto">
          <Box flex={1} marginY={12} minWidth="auto">
            <Panel title="Cliché Visualization">
              <ClicheVisualization />
            </Panel>
          </Box>
        </Flex>
      </Flex>

      <Box flex={1} marginX={24} marginY={12}>
        <Panel title="Logs"></Panel>
      </Box>

      <Box marginX={24}>
        <Attribution />
      </Box>

      {!web3 && <RequireWeb3 onConnect={checkConnection} />}
    </Flex>
  );
}