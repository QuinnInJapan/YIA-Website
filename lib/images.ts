import fs from "fs";
import path from "path";
import { withBasePath } from "./basePath";

// ── Image index ─────────────────────────────────────────────────
// Build a map from basename (case-insensitive) to relative path under original/

const imageIndex: Record<string, string> = {};

function scanImages(dir: string, rel: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const r = rel ? rel + "/" + entry.name : entry.name;
    if (entry.isDirectory()) {
      scanImages(full, r);
    } else if (/\.(jpe?g|png|gif|webp)$/i.test(entry.name)) {
      imageIndex[entry.name.toLowerCase()] = r;
    }
  }
}

const originalDir = path.join(process.cwd(), "public", "original");
scanImages(originalDir, "");

/** Encode path segments for use in src attributes (spaces → %20) */
export function encodePath(p: string): string {
  return p
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

/** Resolve an image filename to its path under /original/ (with basePath prefix) */
export function resolveImage(filename: string): string {
  if (!filename) return "";
  // Already has a path prefix
  if (filename.includes("/"))
    return withBasePath(encodePath("/original/" + filename));
  // Exact match
  const key = filename.toLowerCase();
  if (imageIndex[key])
    return withBasePath(encodePath("/original/" + imageIndex[key]));
  // Try fuzzy match: Kids2024-1.jpg -> Kids2024 (1).JPG
  const fuzzy = key.replace(/-(\d+)\./i, " ($1).");
  if (imageIndex[fuzzy])
    return withBasePath(encodePath("/original/" + imageIndex[fuzzy]));
  // Try with different extension case
  for (const [k, v] of Object.entries(imageIndex)) {
    if (k === key || k === fuzzy)
      return withBasePath(encodePath("/original/" + v));
  }
  // Fallback
  return withBasePath(encodePath("/original/" + filename));
}

/** Resolve an image filename to its local filesystem path (no basePath, for width detection) */
export function resolveImageLocal(filename: string): string {
  if (!filename) return "";
  if (filename.includes("/")) return encodePath("/original/" + filename);
  const key = filename.toLowerCase();
  if (imageIndex[key]) return encodePath("/original/" + imageIndex[key]);
  const fuzzy = key.replace(/-(\d+)\./i, " ($1).");
  if (imageIndex[fuzzy]) return encodePath("/original/" + imageIndex[fuzzy]);
  for (const [k, v] of Object.entries(imageIndex)) {
    if (k === key || k === fuzzy) return encodePath("/original/" + v);
  }
  return encodePath("/original/" + filename);
}

/** Get image width from JPEG/PNG header. Returns 0 on failure. */
export function getImageWidth(filePath: string): number {
  try {
    const buf = fs.readFileSync(filePath);
    // PNG: width at bytes 16-19
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      return buf.readUInt32BE(16);
    }
    // JPEG: scan for SOF markers
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 8) {
        if (buf[i] !== 0xff) {
          i++;
          continue;
        }
        const marker = buf[i + 1];
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          return buf.readUInt16BE(i + 7); // width
        }
        const len = buf.readUInt16BE(i + 2);
        i += 2 + len;
      }
    }
  } catch {
    // ignore
  }
  return 0;
}

export const HERO_MIN_WIDTH = 640;
