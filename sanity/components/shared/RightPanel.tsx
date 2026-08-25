"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@sanity/icons";

const PANEL_WIDTH_STORAGE_KEY = "yia-studio-right-panel-width";
const MIN_PANEL_WIDTH = 320;
const MIN_EDITOR_WIDTH = 360;
const RESIZE_STEP = 32;

function panelBounds(panel: HTMLDivElement) {
  const panelRect = panel.getBoundingClientRect();
  const editor = panel.previousElementSibling as HTMLElement | null;
  const editorLeft = editor?.getBoundingClientRect().left ?? panelRect.left - MIN_EDITOR_WIDTH;
  const availableWidth = panelRect.right - editorLeft;

  return {
    min: MIN_PANEL_WIDTH,
    max: Math.max(MIN_PANEL_WIDTH, Math.floor(availableWidth - MIN_EDITOR_WIDTH)),
  };
}

function clampWidth(width: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(width)));
}

export function RightPanel({
  children,
  mode = "panel",
}: {
  children: React.ReactNode;
  mode?: "panel" | "workspace";
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState<number | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [maxPanelWidth, setMaxPanelWidth] = useState(800);
  const [resizing, setResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastWidthRef = useRef(0);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
    min: number;
    max: number;
  } | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const previousBodyStyleRef = useRef<{ cursor: string; userSelect: string } | null>(null);

  const restoreBodyStyles = useCallback(() => {
    const previous = previousBodyStyleRef.current;
    if (!previous) return;
    document.body.style.cursor = previous.cursor;
    document.body.style.userSelect = previous.userSelect;
    previousBodyStyleRef.current = null;
  }, []);

  const rememberWidth = useCallback((width: number) => {
    try {
      window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(Math.round(width)));
    } catch {
      // The panel remains resizable when storage is unavailable.
    }
  }, []);

  const applyWidth = useCallback(
    (width: number, persist = false) => {
      const panel = panelRef.current;
      if (!panel) return;
      const bounds = panelBounds(panel);
      const nextWidth = clampWidth(width, bounds.min, bounds.max);
      lastWidthRef.current = nextWidth;
      setMaxPanelWidth(bounds.max);
      setPanelWidth(nextWidth);
      if (persist) rememberWidth(nextWidth);
    },
    [rememberWidth],
  );

  useEffect(() => {
    if (mode !== "panel") return;
    const panel = panelRef.current;
    if (!panel) return;

    const observer = new ResizeObserver(() => {
      const width = panel.getBoundingClientRect().width;
      const bounds = panelBounds(panel);
      setMeasuredWidth(Math.round(width));
      setMaxPanelWidth(bounds.max);
      lastWidthRef.current = Math.round(width);
    });
    observer.observe(panel);

    try {
      const savedWidth = Number(window.localStorage.getItem(PANEL_WIDTH_STORAGE_KEY));
      if (Number.isFinite(savedWidth) && savedWidth > 0) applyWidth(savedWidth);
    } catch {
      // Use the stylesheet default when storage is unavailable.
    }

    return () => observer.disconnect();
  }, [applyWidth, mode]);

  useEffect(() => {
    if (mode !== "panel" || panelWidth === null) return;

    const handleWindowResize = () => {
      const panel = panelRef.current;
      if (!panel || window.innerWidth <= 960) return;
      const bounds = panelBounds(panel);
      if (panelWidth > bounds.max || panelWidth < bounds.min) {
        applyWidth(panelWidth);
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [applyWidth, mode, panelWidth]);

  useEffect(
    () => () => {
      resizeCleanupRef.current?.();
      restoreBodyStyles();
    },
    [restoreBodyStyles],
  );

  function handleResizeStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !panelRef.current) return;
    const bounds = panelBounds(panelRef.current);
    const startWidth = panelRef.current.getBoundingClientRect().width;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth,
      ...bounds,
    };
    lastWidthRef.current = startWidth;
    previousBodyStyleRef.current = {
      cursor: document.body.style.cursor,
      userSelect: document.body.style.userSelect,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    setResizing(true);

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== moveEvent.pointerId) return;
      const nextWidth = clampWidth(
        drag.startWidth + drag.startX - moveEvent.clientX,
        drag.min,
        drag.max,
      );
      lastWidthRef.current = nextWidth;
      setMaxPanelWidth(drag.max);
      setPanelWidth(nextWidth);
    };
    const finishResize = (endEvent: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== endEvent.pointerId) return;
      resizeCleanupRef.current?.();
      dragRef.current = null;
      setResizing(false);
      restoreBodyStyles();
      rememberWidth(lastWidthRef.current);
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);
      resizeCleanupRef.current = null;
    };

    resizeCleanupRef.current?.();
    resizeCleanupRef.current = cleanup;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", finishResize);
  }

  function handleResizeKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!panelRef.current) return;
    const currentWidth = panelRef.current.getBoundingClientRect().width;
    const bounds = panelBounds(panelRef.current);
    let nextWidth: number | null = null;

    switch (event.key) {
      case "ArrowLeft":
        nextWidth = currentWidth + RESIZE_STEP;
        break;
      case "ArrowRight":
        nextWidth = currentWidth - RESIZE_STEP;
        break;
      case "Home":
        nextWidth = bounds.min;
        break;
      case "End":
        nextWidth = bounds.max;
        break;
    }

    if (nextWidth === null) return;
    event.preventDefault();
    applyWidth(nextWidth, true);
  }

  function resetWidth() {
    try {
      window.localStorage.removeItem(PANEL_WIDTH_STORAGE_KEY);
    } catch {
      // The stylesheet default can still be restored without storage access.
    }
    setPanelWidth(null);
  }

  if (mode === "panel" && collapsed) {
    return (
      <div className="studio-right-panel studio-right-panel--collapsed">
        <button
          type="button"
          className="studio-panel-rail-button"
          aria-label="プレビュー・ツールパネルを開く"
          title="プレビュー・ツールパネルを開く"
          aria-expanded="false"
          onClick={() => setCollapsed(false)}
        >
          <ChevronLeftIcon />
          <span>プレビュー</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`studio-right-panel studio-right-panel--${mode}${panelWidth !== null ? " studio-right-panel--resized" : ""}`}
      data-resizing={resizing ? "true" : undefined}
      style={mode === "panel" && panelWidth !== null ? { width: panelWidth } : undefined}
    >
      {mode === "panel" ? (
        <>
          <div
            className="studio-panel-resize-handle"
            role="separator"
            aria-label="エディターとプレビューの幅を変更"
            aria-orientation="vertical"
            aria-valuemin={MIN_PANEL_WIDTH}
            aria-valuemax={maxPanelWidth}
            aria-valuenow={measuredWidth || MIN_PANEL_WIDTH}
            aria-valuetext={`プレビュー幅 ${measuredWidth || MIN_PANEL_WIDTH} ピクセル`}
            tabIndex={0}
            title="ドラッグまたは矢印キーで幅を変更。ダブルクリックで初期幅に戻す"
            onPointerDown={handleResizeStart}
            onKeyDown={handleResizeKeyDown}
            onDoubleClick={resetWidth}
          />
          <button
            type="button"
            className="studio-panel-collapse-button studio-panel-collapse-button--right"
            aria-label="プレビュー・ツールパネルを閉じる"
            title="プレビュー・ツールパネルを閉じる"
            aria-expanded="true"
            onClick={() => setCollapsed(true)}
          >
            <ChevronRightIcon />
          </button>
        </>
      ) : null}
      {children}
    </div>
  );
}
