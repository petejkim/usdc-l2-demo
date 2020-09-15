import BN from "bn.js";
import { ERC20_TRANSFER_EVENT_SIG, MaticPOSExit } from "matic-pos-exit";
import Web3 from "web3";

const LOCAL_STORAGE_BURN_KEY = "l2demo:burns";

export interface BurnTx {
  txHash: string;
  blockNumber: number;
  amount: BN;
}

export function addBurn(txHash: string, blockNumber: number, amount: BN): void {
  const burns = loadBurnsFromLocalStorage();
  burns[txHash] = [blockNumber, amount.toString(10)];
  localStorage.setItem(LOCAL_STORAGE_BURN_KEY, JSON.stringify(burns));
}

export function removeBurn(txHash: string): void {
  const burns = loadBurnsFromLocalStorage();
  delete burns[txHash];
  localStorage.setItem(LOCAL_STORAGE_BURN_KEY, JSON.stringify(burns));
}

export function loadBurns(): BurnTx[] {
  const burns = loadBurnsFromLocalStorage();
  return Object.entries(burns).map(([txHash, [blockNumber, amount]]) => ({
    txHash,
    blockNumber,
    amount: new BN(amount, 10),
  }));
}

function loadBurnsFromLocalStorage(): Record<string, [number, string]> {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_BURN_KEY) || "{}");
}

export async function getLastChildBlock(
  web3: Web3,
  rootChain: string
): Promise<number> {
  const contract = new web3.eth.Contract(
    [
      {
        constant: true,
        inputs: [],
        name: "getLastChildBlock",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ],
    rootChain
  );

  const v = await contract.methods.getLastChildBlock().call();

  return parseInt(v);
}

export function getDataForExit(
  burnTxHash: string,
  web3: Web3,
  maticWeb3: Web3,
  rootChain: string
): Promise<string> {
  const posExit = new MaticPOSExit(web3, maticWeb3, rootChain);
  return posExit.buildExitData(burnTxHash, ERC20_TRANSFER_EVENT_SIG);
}
