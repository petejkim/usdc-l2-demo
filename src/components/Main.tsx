import React, { useCallback, useState } from "react";
import { Box, Flex } from "reflexbox";
import Web3 from "web3";
import { L2_JSON_RPC_URL } from "../config";
import { Attribution } from "./Attribution";
import { BlockHeight } from "./BlockHeight";
import { ClicheVisualization } from "./ClicheVisualization";
import { Clock } from "./Clock";
import "./Main.scss";
import { Panel } from "./Panel";
import { RequireWeb3 } from "./RequireWeb3";
import { TabBar, TabId } from "./TabBar";

const web3L2 = new Web3(new Web3.providers.HttpProvider(L2_JSON_RPC_URL));

export function Main(): JSX.Element {
  const [userAddress, setUserAddress] = useState<string>("");
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [activeLayer, setActiveLayer] = useState<1 | 2>(2);

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
            <BlockHeight web3={web3} refreshInterval={7000} />
          </Panel>
        </Box>
        <Box flex={1} margin={12} minWidth="auto">
          <Panel title="L2 / Mumbai Block Height">
            <BlockHeight web3={web3L2} refreshInterval={1000} />
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
            <Panel title="USDC Balance"></Panel>
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
