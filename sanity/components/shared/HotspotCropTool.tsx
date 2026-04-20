"use client";

import { useEffect, useRef, useState } from "react";
import { fs } from "@/sanity/lib/studioTokens";

// ── Types ────────────────────────────────────────────────

export interface HotspotCropValue {
  hotspot: { x: number; y: number; width: number; height: number };
  crop: { top: number; bottom: number; left: number; right: number };
}

// ── Constants ────────────────────────────────────────────

export const DEFAULT_HOTSPOT = { x: 0.5, y: 0.5, width: 0.3, height: 0.3 };
export const DEFAULT_CROP = { top: 0, bottom: 0, left: 0, right: 0 };
const HANDLE_SIZE = 8;
const HANDLE_HIT = 24;
const HANDLE_HOTSPOT = 16;
const MIN_CROP = 0.05;

export const PREVIEW_RATIOS = [
  { label: "3:4", w: 3, h: 4 },
  { label: "正方形", w: 1, h: 1 },
  { label: "16:9", w: 16, h: 9 },
  { label: "パノラマ", w: 4, h: 1 },
];

// ── Helpers ──────────────────────────────────────────────

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Compute the visible region of an image given crop + hotspot for a target aspect ratio */
export function computePreviewRect(
  imgW: number,
  imgH: number,
  hotspot: HotspotCropValue["hotspot"],
  crop: HotspotCropValue["crop"],
  targetW: number,
  targetH: number,
) {
  const cLeft = crop.left * imgW;
  const cTop = crop.top * imgH;
  const cW = (1 - crop.left - crop.right) * imgW;
  const cH = (1 - crop.top - crop.bottom) * imgH;
  const targetAspect = targetW / targetH;
  const cropAspect = cW / cH;

  let rw: number, rh: number;
  if (cropAspect > targetAspect) {
    rh = cH;
    rw = cH * targetAspect;
  } else {
    rw = cW;
    rh = cW / targetAspect;
  }

  // Center on hotspot within crop
  const hxPx = hotspot.x * imgW;
  const hyPx = hotspot.y * imgH;
  let rx = hxPx - rw / 2;
  let ry = hyPx - rh / 2;
  rx = clamp(rx, cLeft, cLeft + cW - rw);
  ry = clamp(ry, cTop, cTop + cH - rh);

  return { x: rx / imgW, y: ry / imgH, w: rw / imgW, h: rh / imgH };
}

// ── Component ────────────────────────────────────────────

export function HotspotCropTool({
  imageUrl,
  value,
  onChange,
  onClose,
}: {
  imageUrl: string;
  value: HotspotCropValue;
  onChange: (value: HotspotCropValue) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [hotspot, setHotspot] = useState(value.hotspot);
  const [crop, setCrop] = useState(value.crop);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragRef = useRef<{
    target: string;
    startX: number;
    startY: number;
    startHotspot: typeof hotspot;
    startCrop: typeof crop;
  } | null>(null);

  // Track container size reactively so SVG overlay positions correctly on first render
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const containerW = containerSize.w;
  const containerH = containerSize.h;
  let imgW = containerW;
  let imgH = containerH;
  if (imgSize && containerW > 0 && containerH > 0) {
    const scale = Math.min(containerW / imgSize.w, containerH / imgSize.h);
    imgW = imgSize.w * scale;
    imgH = imgSize.h * scale;
  }
  const offsetX = (containerW - imgW) / 2;
  const offsetY = (containerH - imgH) / 2;

  const cropX = crop.left * imgW;
  const cropY = crop.top * imgH;
  const cropW = (1 - crop.left - crop.right) * imgW;
  const cropH = (1 - crop.top - crop.bottom) * imgH;

  const hx = hotspot.x * imgW;
  const hy = hotspot.y * imgH;
  const hrx = (hotspot.width / 2) * imgW;
  const hry = (hotspot.height / 2) * imgH;

  // Hotspot handle at 45° (matching Sanity)
  const hAngle = Math.PI * 0.25;
  const hhx = hx + Math.cos(hAngle) * hrx;
  const hhy = hy + Math.sin(hAngle) * hry;

  function toNorm(px: number, py: number, rect: DOMRect) {
    return {
      nx: clamp((px - rect.left - offsetX) / imgW, 0, 1),
      ny: clamp((py - rect.top - offsetY) / imgH, 0, 1),
    };
  }

  function handlePointerDown(e: React.PointerEvent, target: string) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(target);
    dragRef.current = {
      target,
      startX: e.clientX,
      startY: e.clientY,
      startHotspot: { ...hotspot },
      startCrop: { ...crop },
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / imgW;
    const dy = (e.clientY - drag.startY) / imgH;
    const t = drag.target;

    if (t === "hotspot") {
      setHotspot({
        ...drag.startHotspot,
        x: clamp(drag.startHotspot.x + dx, 0, 1),
        y: clamp(drag.startHotspot.y + dy, 0, 1),
      });
    } else if (t === "hotspot-handle") {
      const rect = containerRef.current!.getBoundingClientRect();
      const { nx, ny } = toNorm(e.clientX, e.clientY, rect);
      setHotspot({
        ...hotspot,
        width: clamp(Math.abs(nx - hotspot.x) * 2, MIN_CROP, 1),
        height: clamp(Math.abs(ny - hotspot.y) * 2, MIN_CROP, 1),
      });
    } else if (t === "crop") {
      const maxL = 1 - (1 - drag.startCrop.left - drag.startCrop.right);
      const maxT = 1 - (1 - drag.startCrop.top - drag.startCrop.bottom);
      const nL = clamp(drag.startCrop.left + dx, 0, maxL);
      const nT = clamp(drag.startCrop.top + dy, 0, maxT);
      const sw = 1 - drag.startCrop.left - drag.startCrop.right;
      const sh = 1 - drag.startCrop.top - drag.startCrop.bottom;
      setCrop({ left: nL, top: nT, right: 1 - nL - sw, bottom: 1 - nT - sh });
    } else if (t === "crop-top") {
      setCrop({
        ...drag.startCrop,
        top: clamp(drag.startCrop.top + dy, 0, 1 - drag.startCrop.bottom - MIN_CROP),
      });
    } else if (t === "crop-bottom") {
      setCrop({
        ...drag.startCrop,
        bottom: clamp(drag.startCrop.bottom - dy, 0, 1 - drag.startCrop.top - MIN_CROP),
      });
    } else if (t === "crop-left") {
      setCrop({
        ...drag.startCrop,
        left: clamp(drag.startCrop.left + dx, 0, 1 - drag.startCrop.right - MIN_CROP),
      });
    } else if (t === "crop-right") {
      setCrop({
        ...drag.startCrop,
        right: clamp(drag.startCrop.right - dx, 0, 1 - drag.startCrop.left - MIN_CROP),
      });
    } else if (t === "crop-topLeft") {
      setCrop({
        ...drag.startCrop,
        top: clamp(drag.startCrop.top + dy, 0, 1 - drag.startCrop.bottom - MIN_CROP),
        left: clamp(drag.startCrop.left + dx, 0, 1 - drag.startCrop.right - MIN_CROP),
      });
    } else if (t === "crop-topRight") {
      setCrop({
        ...drag.startCrop,
        top: clamp(drag.startCrop.top + dy, 0, 1 - drag.startCrop.bottom - MIN_CROP),
        right: clamp(drag.startCrop.right - dx, 0, 1 - drag.startCrop.left - MIN_CROP),
      });
    } else if (t === "crop-bottomLeft") {
      setCrop({
        ...drag.startCrop,
        bottom: clamp(drag.startCrop.bottom - dy, 0, 1 - drag.startCrop.top - MIN_CROP),
        left: clamp(drag.startCrop.left + dx, 0, 1 - drag.startCrop.right - MIN_CROP),
      });
    } else if (t === "crop-bottomRight") {
      setCrop({
        ...drag.startCrop,
        bottom: clamp(drag.startCrop.bottom - dy, 0, 1 - drag.startCrop.top - MIN_CROP),
        right: clamp(drag.startCrop.right - dx, 0, 1 - drag.startCrop.left - MIN_CROP),
      });
    }
  }

  function handlePointerUp() {
    dragRef.current = null;
    setDragging(null);
  }

  // L-shaped corner handle path
  function cornerPath(cx: number, cy: number, dx: number, dy: number) {
    const s = HANDLE_SIZE + 2;
    return `M${cx},${cy + dy * s} L${cx},${cy} L${cx + dx * s},${cy}`;
  }

  const cropActive = dragging?.startsWith("crop");
  const hotspotActive = dragging === "hotspot" || dragging === "hotspot-handle";
  const cropStroke = cropActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)";
  const hotspotStroke = hotspotActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.5)";

  const cornerCursors: Record<string, string> = {
    "crop-topLeft": "nwse-resize",
    "crop-topRight": "nesw-resize",
    "crop-bottomLeft": "nesw-resize",
    "crop-bottomRight": "nwse-resize",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid var(--card-border-color)",
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: fs.body }}>切り抜き & フォーカス</div>
          <div style={{ fontSize: fs.meta, color: "var(--card-muted-fg-color)", marginTop: 2 }}>
            四角形で切り抜き範囲。円でフォーカス領域。
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "5px 14px",
              borderRadius: 3,
              border: "1px solid var(--card-border-color)",
              background: "transparent",
              cursor: "pointer",
              fontSize: fs.label,
              color: "inherit",
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => {
              onChange({ hotspot, crop });
              onClose();
            }}
            style={{
              padding: "5px 14px",
              borderRadius: 3,
              border: "none",
              background: "#2276fc",
              color: "#fff",
              cursor: "pointer",
              fontSize: fs.label,
              fontWeight: 500,
            }}
          >
            適用
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          userSelect: "none",
          touchAction: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
        }}
      >
        {/* Background image at 25% opacity (Sanity shows full image dimly behind crop) */}
        <img
          src={imageUrl}
          alt=""
          onLoad={(e) =>
            setImgSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
            opacity: 0.25,
          }}
        />
        {imgSize && (
          <svg
            style={{
              position: "absolute",
              left: offsetX,
              top: offsetY,
              width: imgW,
              height: imgH,
            }}
            overflow="visible"
            fill="none"
          >
            <defs>
              <mask id="hc-crop-mask">
                <rect width={imgW} height={imgH} fill="white" />
                <rect x={cropX} y={cropY} width={cropW} height={cropH} fill="black" />
              </mask>
              <clipPath id="hc-crop-clip">
                <rect x={cropX} y={cropY} width={cropW} height={cropH} />
              </clipPath>
            </defs>

            {/* Full-brightness image clipped to crop area */}
            <image
              href={imageUrl}
              width={imgW}
              height={imgH}
              clipPath="url(#hc-crop-clip)"
              preserveAspectRatio="none"
            />

            {/* Dark overlay outside crop */}
            <rect
              width={imgW}
              height={imgH}
              fill="rgba(0,0,0,0.5)"
              mask="url(#hc-crop-mask)"
              pointerEvents="none"
            />

            {/* Crop border (draggable body) */}
            <rect
              x={cropX}
              y={cropY}
              width={cropW}
              height={cropH}
              stroke={cropStroke}
              strokeWidth={cropActive ? 2 : 1}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: dragging === "crop" ? "grabbing" : "grab" }}
              onPointerDown={(e) => handlePointerDown(e, "crop")}
            />

            {/* Edge handles */}
            <rect
              x={cropX + cropW / 2 - 16}
              y={cropY - HANDLE_SIZE / 2}
              width={32}
              height={HANDLE_SIZE}
              fill="#fff"
              stroke="#000"
              strokeWidth={1}
              rx={1}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: "ns-resize" }}
              onPointerDown={(e) => handlePointerDown(e, "crop-top")}
            />
            <rect
              x={cropX + cropW / 2 - 16}
              y={cropY + cropH - HANDLE_SIZE / 2}
              width={32}
              height={HANDLE_SIZE}
              fill="#fff"
              stroke="#000"
              strokeWidth={1}
              rx={1}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: "ns-resize" }}
              onPointerDown={(e) => handlePointerDown(e, "crop-bottom")}
            />
            <rect
              x={cropX - HANDLE_SIZE / 2}
              y={cropY + cropH / 2 - 16}
              width={HANDLE_SIZE}
              height={32}
              fill="#fff"
              stroke="#000"
              strokeWidth={1}
              rx={1}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: "ew-resize" }}
              onPointerDown={(e) => handlePointerDown(e, "crop-left")}
            />
            <rect
              x={cropX + cropW - HANDLE_SIZE / 2}
              y={cropY + cropH / 2 - 16}
              width={HANDLE_SIZE}
              height={32}
              fill="#fff"
              stroke="#000"
              strokeWidth={1}
              rx={1}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: "ew-resize" }}
              onPointerDown={(e) => handlePointerDown(e, "crop-right")}
            />

            {/* Corner handles — L-shaped */}
            {(
              [
                { t: "crop-topLeft", x: cropX, y: cropY, dx: 1, dy: 1 },
                { t: "crop-topRight", x: cropX + cropW, y: cropY, dx: -1, dy: 1 },
                { t: "crop-bottomLeft", x: cropX, y: cropY + cropH, dx: 1, dy: -1 },
                { t: "crop-bottomRight", x: cropX + cropW, y: cropY + cropH, dx: -1, dy: -1 },
              ] as const
            ).map(({ t, x, y, dx, dy }) => (
              <g key={t}>
                <path
                  d={cornerPath(x, y, dx, dy)}
                  stroke="#fff"
                  strokeWidth={3}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x={x - HANDLE_HIT / 2}
                  y={y - HANDLE_HIT / 2}
                  width={HANDLE_HIT}
                  height={HANDLE_HIT}
                  fill="transparent"
                  style={{ cursor: cornerCursors[t] }}
                  onPointerDown={(e) => handlePointerDown(e, t)}
                />
              </g>
            ))}

            {/* Hotspot guidelines — dashed crosshairs */}
            <line
              x1={hx}
              y1={0}
              x2={hx}
              y2={imgH}
              stroke="var(--card-fg-color, #fff)"
              strokeOpacity={0.2}
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            <line
              x1={0}
              y1={hy}
              x2={imgW}
              y2={hy}
              stroke="var(--card-fg-color, #fff)"
              strokeOpacity={0.2}
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            {/* Hotspot boundary lines */}
            <line
              x1={hx - hrx}
              y1={0}
              x2={hx - hrx}
              y2={imgH}
              stroke="var(--card-fg-color, #fff)"
              strokeOpacity={0.1}
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            <line
              x1={hx + hrx}
              y1={0}
              x2={hx + hrx}
              y2={imgH}
              stroke="var(--card-fg-color, #fff)"
              strokeOpacity={0.1}
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            <line
              x1={0}
              y1={hy - hry}
              x2={imgW}
              y2={hy - hry}
              stroke="var(--card-fg-color, #fff)"
              strokeOpacity={0.1}
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            <line
              x1={0}
              y1={hy + hry}
              x2={imgW}
              y2={hy + hry}
              stroke="var(--card-fg-color, #fff)"
              strokeOpacity={0.1}
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />

            {/* Hotspot ellipse */}
            <ellipse
              cx={hx}
              cy={hy}
              rx={hrx}
              ry={hry}
              stroke={hotspotStroke}
              strokeWidth={hotspotActive ? 2 : 1}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: dragging === "hotspot" ? "grabbing" : "grab" }}
              onPointerDown={(e) => handlePointerDown(e, "hotspot")}
            />

            {/* Hotspot center dot */}
            <circle
              cx={hx}
              cy={hy}
              r={3}
              fill="#fff"
              stroke="#000"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: dragging === "hotspot" ? "grabbing" : "grab" }}
              onPointerDown={(e) => handlePointerDown(e, "hotspot")}
            />

            {/* Hotspot resize handle at 45° */}
            <circle
              cx={hhx}
              cy={hhy}
              r={HANDLE_HOTSPOT / 2}
              fill="#fff"
              stroke="#000"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: "move" }}
              onPointerDown={(e) => handlePointerDown(e, "hotspot-handle")}
            />
          </svg>
        )}
      </div>

      {/* Preview strip */}
      {imgSize && (
        <div style={{ padding: "12px 16px 16px", borderTop: "1px solid var(--card-border-color)" }}>
          <div style={{ fontSize: fs.meta, color: "var(--card-muted-fg-color)", marginBottom: 8 }}>
            プレビュー
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {PREVIEW_RATIOS.map(({ label, w, h }) => {
              const pr = computePreviewRect(imgSize.w, imgSize.h, hotspot, crop, w, h);
              return (
                <div key={label}>
                  <div
                    style={{
                      fontSize: fs.meta,
                      color: "var(--card-muted-fg-color)",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: `${w} / ${h}`,
                      borderRadius: 2,
                      border: "1px solid var(--card-border-color)",
                      backgroundImage: `url(${imageUrl})`,
                      backgroundSize: `${(1 / pr.w) * 100}% ${(1 / pr.h) * 100}%`,
                      backgroundPosition: `${pr.w < 1 ? (pr.x / (1 - pr.w)) * 100 : 0}% ${pr.h < 1 ? (pr.y / (1 - pr.h)) * 100 : 0}%`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
