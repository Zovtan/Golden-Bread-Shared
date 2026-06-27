import { useCallback, useRef } from "react";









export function useSubmitLock() {
  const lockRef = useRef(false);
  return useCallback((fn) => async (...args) => {
    if (lockRef.current) return;
    lockRef.current = true;
    try {
      return await fn(...args);
    } finally {
      lockRef.current = false;
    }
  }, []);
}