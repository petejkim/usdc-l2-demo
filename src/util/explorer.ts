export function explorerTxHashUrl(explorerUrl: string, txHash: string): string {
  return `${explorerUrl}/tx/${txHash}`;
}
