"use client";

import { createContext, useContext, useRef, useEffect } from "react";
import type { ElementType, ComponentPropsWithoutRef, ReactNode, CSSProperties } from "react";
import { useStudioContext } from "@/lib/studio-context";

// Tracks the composed dot-path ID of the nearest ancestor StudioRegion.
// Empty string at root — meaning this StudioRegion has no parent.
export const ParentIdContext = createContext<string>("");

type AsProp<T extends ElementType> = { as?: T };
type StudioRegionOwnProps = { studioId: string; style?: CSSProperties; children?: ReactNode };
type StudioRegionProps<T extends ElementType = "div"> = AsProp<T> &
  StudioRegionOwnProps &
  Omit<ComponentPropsWithoutRef<T>, keyof AsProp<T> | keyof StudioRegionOwnProps>;

export function StudioRegion<T extends ElementType = "div">({
  as,
  studioId,
  style,
  children,
  ...props
}: StudioRegionProps<T>) {
  const Tag = (as ?? "div") as ElementType;

  // Build full dot-path ID: parent "" + "hero" = "hero"; "hero" + "title" = "hero.title"
  const parentId = useContext(ParentIdContext);
  const fullId = parentId ? `${parentId}.${studioId}` : studioId;

  const studio = useStudioContext();
  const isDirectFocus = studio?.focusedId === fullId;
  const isAncestorFocus = studio?.focusedId?.startsWith(`${fullId}.`) ?? false;

  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isDirectFocus) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isDirectFocus]);

  const outlineStyle: CSSProperties | undefined = isDirectFocus
    ? { outline: "2px solid var(--card-focus-ring-color)" }
    : isAncestorFocus
      ? { outline: "1px dashed var(--card-focus-ring-color)" }
      : undefined;

  return (
    <ParentIdContext.Provider value={fullId}>
      {/* `as any` needed: TypeScript can't narrow ElementType to a specific ref type in this generic context */}
      <Tag ref={ref as any} style={outlineStyle ? { ...style, ...outlineStyle } : style} {...props}>
        {children}
      </Tag>
    </ParentIdContext.Provider>
  );
}
