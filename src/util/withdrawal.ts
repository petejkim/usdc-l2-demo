const LOCAL_STORAGE_BURN_KEY = "l2demo:burns";

export function addBurnTx(txHash: string, blockNumber: number): void {
  const burns: Record<string, number> = JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_BURN_KEY) || "{}"
  );
  burns[txHash] = blockNumber;
  localStorage.setItem(LOCAL_STORAGE_BURN_KEY, JSON.stringify(burns));
}
