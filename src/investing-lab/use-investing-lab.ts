"use client";

import { useCallback, useEffect, useState } from "react";
import { buyShares, createInitialPortfolio, sanitizePortfolioState, sellShares, toggleWatchlist } from "./engine";
import type { PortfolioState } from "./types";

/**
 * The ONLY place this feature touches `window.localStorage` directly —
 * every other Investing Lab file works with the pure PortfolioState
 * shape from types.ts/engine.ts. Namespaced and versioned exactly like
 * moneyquest_local_progress_v1, and entirely separate from it: this is
 * a self-contained sandbox with its own fixed starting virtual cash,
 * never the child's real Wallet balance from completing lessons/games.
 * Nothing here ever leaves the device.
 */
const STORAGE_KEY = "moneyquest_investing_lab_v1";

function readFromStorage(): PortfolioState {
  if (typeof window === "undefined") return createInitialPortfolio();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialPortfolio();
    return sanitizePortfolioState(JSON.parse(raw));
  } catch {
    return createInitialPortfolio();
  }
}

function writeToStorage(state: PortfolioState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail (private browsing, quota exceeded, disabled
    // entirely) - the lab keeps working in-memory for the rest of the
    // session rather than throw, even though it won't persist.
  }
}

export function resetInvestingLab(): PortfolioState {
  const fresh = createInitialPortfolio();
  writeToStorage(fresh);
  return fresh;
}

export function useInvestingLab() {
  const [state, setState] = useState<PortfolioState>(createInitialPortfolio());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setState(readFromStorage());
    setIsLoaded(true);
  }, []);

  const persist = useCallback((next: PortfolioState) => {
    setState(next);
    writeToStorage(next);
  }, []);

  const buy = useCallback(
    (companyId: string, shares: number, pricePerShareMinorUnits: number) => {
      const result = buyShares(state, companyId, shares, pricePerShareMinorUnits, Date.now());
      if (!result.error) persist(result.state);
      return result;
    },
    [state, persist]
  );

  const sell = useCallback(
    (companyId: string, shares: number, pricePerShareMinorUnits: number) => {
      const result = sellShares(state, companyId, shares, pricePerShareMinorUnits, Date.now());
      if (!result.error) persist(result.state);
      return result;
    },
    [state, persist]
  );

  const toggleWatch = useCallback(
    (companyId: string) => {
      persist(toggleWatchlist(state, companyId));
    },
    [state, persist]
  );

  const reset = useCallback(() => {
    setState(resetInvestingLab());
  }, []);

  return { state, isLoaded, buy, sell, toggleWatch, reset };
}
