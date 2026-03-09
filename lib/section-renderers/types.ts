import type React from "react";

export interface SectionContext {
  push: (...nodes: React.ReactNode[]) => void;
  flush: () => void;
  addTocHeader: (textJa: string, textEn?: string) => void;
}

export type SectionHandler<T = any> = (section: T, ctx: SectionContext) => void;
