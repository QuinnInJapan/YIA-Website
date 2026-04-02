// lib/studio-context.tsx
"use client";

import { createContext, useContext } from "react";

export interface StudioContextValue {
  focusedId: string | null;
}

export const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudioContext(): StudioContextValue | null {
  return useContext(StudioContext);
}
