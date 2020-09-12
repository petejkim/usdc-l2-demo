import React from "react";
import { Box, Flex } from "reflexbox";
import { Attribution } from "./Attribution";
import { ClicheVisualization } from "./ClicheVisualization";
import { Clock } from "./Clock";
import "./Main.scss";
import { Panel } from "./Panel";

export function Main(): JSX.Element {
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
          <Panel title="Wallet Address"></Panel>
        </Box>
        <Box flex={1} margin={12} minWidth="auto">
          <Panel title="L1 / Görli Block Height"></Panel>
        </Box>
        <Box flex={1} margin={12} minWidth="auto">
          <Panel title="L2 / Mumbai Block Height"></Panel>
        </Box>
        <Box flexShrink={0} margin={12}>
          <Clock />
        </Box>
      </Flex>
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
            <Panel title="Upload USDC to L2"></Panel>
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
    </Flex>
  );
}
