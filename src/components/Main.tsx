import BN from "bn.js";
import React, { useCallback, useState } from "react";
import { Box, Flex } from "reflexbox";
import Web3 from "web3";
import {
  L1_EXPLORER_URL,
  L1_POS_ERC20_PREDICATE_CONTRACT,
  L1_POS_ROOT_CHAIN_MANAGER_CONTRACT,
  L1_ROOT_CHAIN_CONTRACT,
  L1_TOKEN_CONTRACT,
  L1_TOKEN_FAUCET,
  L2_CHAIN_ID,
  L2_CONTRACT_NAME,
  L2_CONTRACT_VERSION,
  L2_EXPLORER_URL,
  L2_GAS_RELAY_URL,
  L2_JSON_RPC_URL,
  L2_TOKEN_CONTRACT,
} from "../config";
import { Attribution } from "./Attribution";
import { BlockHeight } from "./BlockHeight";
import { ClaimWithdrawal } from "./ClaimWithdrawal";
import { ClicheVisualization } from "./ClicheVisualization";
import { Clock } from "./Clock";
import { Deposit } from "./Deposit";
import { L1Notice } from "./L1Notice";
import { LastCheckpoint } from "./LastCheckpoint";
import { Logs } from "./Logs";
import "./Main.scss";
import { Panel } from "./Panel";
import { RequireWeb3 } from "./RequireWeb3";
import { TabBar, TabId } from "./TabBar";
import { TokenBalance } from "./TokenBalance";
import { TransferToken } from "./TransferToken";
import { WalletAddress } from "./WalletAddress";
import { Withdraw } from "./Withdraw";

const L1_REFRESH_INTERVAL = 7000;
const L2_REFRESH_INTERVAL = 1000;
const CHECKPOINT_REFRESH_INTERVAL = 60000;

const L2_GAS_ABSTRACTION = {
  relayUrl: L2_GAS_RELAY_URL,
  eip712: {
    useSalt: true,
    name: L2_CONTRACT_NAME,
    version: L2_CONTRACT_VERSION,
    chainId: L2_CHAIN_ID,
  },
};

const DECIMAL_PLACES = 6;

const web3L2 = new Web3(new Web3.providers.HttpProvider(L2_JSON_RPC_URL));

export function Main(): JSX.Element {
  const [userAddress, setUserAddress] = useState<string>("");
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [activeLayer, setActiveLayer] = useState<1 | 2>(2);
  const [balanceL1, setBalanceL1] = useState<BN | null>(null);
  const [balanceL2, setBalanceL2] = useState<BN | null>(null);
  const [checkpoint, setCheckpoint] = useState<number>(0);

  const checkConnection = useCallback(
    (address: string, ethereum: any): void => {
      if (address) {
        setUserAddress(address);
        setWeb3(new Web3(ethereum));

        window?.ethereum?.on?.("accountsChanged", () => {
          window.location.reload();
        });
      }
    },
    []
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

  const checkpointChange = useCallback((checkpoint: number) => {
    setCheckpoint(checkpoint);
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
        flexShrink={0}
        justifyContent="space-evenly"
        alignItems="center"
        marginX={12}
        marginY={0}
      >
        <Box flex={1} margin={12} minWidth="auto">
          <Panel title="Wallet Address">
            <WalletAddress address={userAddress} />
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

      <Box marginX={24} marginY={12}>
        <TabBar selected={activeLayer} onSelect={selectLayer} />
      </Box>

      {activeLayer === 1 && (
        <Box marginX={24} marginY={12}>
          <L1Notice />
        </Box>
      )}

      <Flex
        className="Main-mid-panels"
        justifyContent="space-evenly"
        flexShrink={0}
        flexWrap="wrap"
        marginX={12}
        marginY={0}
      >
        {activeLayer === 1 ? (
          <Flex
            key={1}
            flex={1}
            marginX={12}
            flexDirection="column"
            minWidth="auto"
          >
            <Box flex={1} marginY={12} minWidth="auto">
              <Panel title="L1 USDC Balance">
                <TokenBalance
                  web3={web3}
                  signerWeb3={null}
                  userAddress={userAddress}
                  tokenContract={L1_TOKEN_CONTRACT}
                  tokenFaucet={L1_TOKEN_FAUCET}
                  decimalPlaces={DECIMAL_PLACES}
                  refreshInterval={L1_REFRESH_INTERVAL}
                  initialBalance={balanceL1}
                  explorerUrl={L1_EXPLORER_URL}
                  onChange={balanceL1Change}
                />
              </Panel>
            </Box>
            <Box flex={1} marginY={12} minWidth="auto">
              <Panel title="Transfer USDC">
                <TransferToken
                  signerWeb3={web3}
                  userAddress={userAddress}
                  tokenContract={L1_TOKEN_CONTRACT}
                  balance={balanceL1}
                  decimalPlaces={DECIMAL_PLACES}
                  explorerUrl={L1_EXPLORER_URL}
                />
              </Panel>
            </Box>
            <Box flex={1} marginY={12} minWidth="auto">
              <Panel title="Deposit USDC to Layer 2">
                <Deposit
                  web3={web3}
                  userAddress={userAddress}
                  tokenContract={L1_TOKEN_CONTRACT}
                  posRootChainManager={L1_POS_ROOT_CHAIN_MANAGER_CONTRACT}
                  posERC20Predicate={L1_POS_ERC20_PREDICATE_CONTRACT}
                  balance={balanceL1}
                  decimalPlaces={DECIMAL_PLACES}
                  explorerUrl={L1_EXPLORER_URL}
                />
              </Panel>
            </Box>
          </Flex>
        ) : (
          <Flex
            key={2}
            flex={1}
            marginX={12}
            flexDirection="column"
            minWidth="auto"
          >
            <Box flex={1} marginY={12} minWidth="auto">
              <Panel title="L2 USDC Balance">
                <TokenBalance
                  web3={web3L2}
                  signerWeb3={web3}
                  userAddress={userAddress}
                  tokenContract={L2_TOKEN_CONTRACT}
                  tokenFaucet={""}
                  decimalPlaces={DECIMAL_PLACES}
                  refreshInterval={L2_REFRESH_INTERVAL}
                  initialBalance={balanceL2}
                  gasAbstraction={L2_GAS_ABSTRACTION}
                  explorerUrl={L2_EXPLORER_URL}
                  onChange={balanceL2Change}
                />
              </Panel>
            </Box>
            <Box flex={1} marginY={12} minWidth="auto">
              <Panel title="Transfer USDC Gaslessly">
                <TransferToken
                  signerWeb3={web3}
                  userAddress={userAddress}
                  tokenContract={L2_TOKEN_CONTRACT}
                  balance={balanceL2}
                  decimalPlaces={DECIMAL_PLACES}
                  gasAbstraction={L2_GAS_ABSTRACTION}
                  explorerUrl={L2_EXPLORER_URL}
                />
              </Panel>
            </Box>
            <Box flex={1} marginY={12} minWidth="auto">
              <Panel title="Withdraw USDC to Layer 1">
                <Withdraw
                  signerWeb3={web3}
                  userAddress={userAddress}
                  tokenContract={L2_TOKEN_CONTRACT}
                  balance={balanceL2}
                  decimalPlaces={DECIMAL_PLACES}
                  gasAbstraction={L2_GAS_ABSTRACTION}
                  explorerUrl={L2_EXPLORER_URL}
                />
              </Panel>
            </Box>
          </Flex>
        )}
        <Flex flex={1} marginX={12} flexDirection="column" minWidth="auto">
          {activeLayer === 1 && (
            <Box flexShrink={0} marginY={12} minWidth="auto">
              <Panel title="Last Checkpoint">
                <LastCheckpoint
                  web3={web3}
                  rootChain={L1_ROOT_CHAIN_CONTRACT}
                  refreshInterval={CHECKPOINT_REFRESH_INTERVAL}
                  initialCheckpoint={checkpoint}
                  onChange={checkpointChange}
                />
              </Panel>
            </Box>
          )}
          <Box className="Main-mid-right" flexGrow={1} marginY={12}>
            {activeLayer === 1 ? (
              <Panel title="Claim Withdrawals">
                <ClaimWithdrawal
                  web3={web3}
                  web3L2={web3L2}
                  userAddress={userAddress}
                  rootChain={L1_ROOT_CHAIN_CONTRACT}
                  posRootChainManager={L1_POS_ROOT_CHAIN_MANAGER_CONTRACT}
                  decimalPlaces={DECIMAL_PLACES}
                  explorerUrl={L1_EXPLORER_URL}
                  explorerUrlL2={L2_EXPLORER_URL}
                  checkpoint={checkpoint}
                />
              </Panel>
            ) : (
              <Panel className="Main-visualization" title="Blockchain Magic">
                <ClicheVisualization />
              </Panel>
            )}
          </Box>
        </Flex>
      </Flex>

      <Box
        className="Main-logs"
        flex={1}
        flexShrink={0}
        marginX={24}
        marginY={12}
      >
        <Panel title="Logs">
          <Logs />
        </Panel>
      </Box>

      <Box flexShrink={0} marginX={24}>
        <Attribution />
      </Box>

      {!web3 && <RequireWeb3 onConnect={checkConnection} />}
    </Flex>
  );
}
