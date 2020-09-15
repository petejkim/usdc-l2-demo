import { useCallback, useState } from "react";

export function useRerender(): [number, () => void] {
  const [i, setI] = useState(0);
  const rerender = useCallback(() => setI(i + 1), [i]);
  return [i, rerender];
}
