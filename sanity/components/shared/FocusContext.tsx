"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { StudioContext } from "@/lib/studio-context";

interface FocusContextValue {
  focusedId: string | null;
  setFocus: (id: string) => void;
  clearFocus: () => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function useFocusContext(): FocusContextValue {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocusContext must be used within FocusProvider");
  return ctx;
}

export function FocusProvider({ children }: { children: ReactNode }) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setFocus(id: string) {
    // Cancel any pending clear before setting new focus — prevents flicker
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setFocusedId(id);
  }

  function clearFocus() {
    timerRef.current = setTimeout(() => {
      setFocusedId(null);
      timerRef.current = null;
    }, 50);
  }

  const value: FocusContextValue = { focusedId, setFocus, clearFocus };

  return (
    <FocusContext.Provider value={value}>
      <StudioContext.Provider value={{ focusedId }}>{children}</StudioContext.Provider>
    </FocusContext.Provider>
  );
}
