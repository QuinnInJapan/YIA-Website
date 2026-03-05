#!/usr/bin/env node
import SvgPath from "svgpath";
import { readFileSync, writeFileSync } from "fs";

const svg = readFileSync("/Users/quinnngo/Downloads/picsvg_modified.svg", "utf8");
const pathDatas = [...svg.matchAll(/d="([^"]+)"/g)].map(m => m[1]).slice(1);

function rdp(points, epsilon) {
  if (points.length <= 2) return points;
  let maxDist = 0, maxIdx = 0;
  const [start, end] = [points[0], points[points.length - 1]];
  for (let i = 1; i < points.length - 1; i++) {
    const d = ptLineDist(points[i], start, end);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, maxIdx + 1), epsilon);
    const right = rdp(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [start, end];
}

function ptLineDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function samplePath(d) {
  const subpaths = [];
  let cur = [];
  let cx = 0, cy = 0;
  const p = new SvgPath(d).abs().unshort();
  p.iterate((seg) => {
    const cmd = seg[0];
    if (cmd === "M") {
      if (cur.length) subpaths.push(cur);
      cur = [[seg[1], seg[2]]];
      cx = seg[1]; cy = seg[2];
    } else if (cmd === "L") {
      cur.push([seg[1], seg[2]]);
      cx = seg[1]; cy = seg[2];
    } else if (cmd === "C") {
      const [x0, y0] = [cx, cy];
      const [x1, y1, x2, y2, x3, y3] = [seg[1], seg[2], seg[3], seg[4], seg[5], seg[6]];
      for (let t = 0.1; t <= 1.001; t += 0.1) {
        const u = 1 - t;
        cur.push([
          u*u*u*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3,
          u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3,
        ]);
      }
      cx = x3; cy = y3;
    } else if (cmd === "Z" || cmd === "z") {
      if (cur.length) {
        cur.push([...cur[0]]);
        subpaths.push(cur);
        cur = [];
      }
    }
  });
  if (cur.length) subpaths.push(cur);
  return subpaths;
}

function fitBeziers(points) {
  if (points.length < 2) return "";
  let d = `M${r(points[0][0])},${r(points[0][1])}`;
  if (points.length === 2) return d + ` L${r(points[1][0])},${r(points[1][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const a = 1 / 3;
    const cp1x = p1[0] + a * (p2[0] - p0[0]);
    const cp1y = p1[1] + a * (p2[1] - p0[1]);
    const cp2x = p2[0] - a * (p3[0] - p1[0]);
    const cp2y = p2[1] - a * (p3[1] - p1[1]);
    d += ` C${r(cp1x)},${r(cp1y)} ${r(cp2x)},${r(cp2y)} ${r(p2[0])},${r(p2[1])}`;
  }
  return d;
}

function r(n) { return Math.round(n); }

const epsilon = 150;
const newPaths = [];
let totalPts = 0;

for (let i = 0; i < pathDatas.length; i++) {
  const subpaths = samplePath(pathDatas[i]);
  let fullD = "";
  for (const points of subpaths) {
    const simplified = rdp(points, epsilon);
    totalPts += simplified.length;
    const isClosed = points.length > 2 &&
      Math.hypot(points[0][0] - points[points.length - 1][0], points[0][1] - points[points.length - 1][1]) < 1;
    fullD += fitBeziers(simplified) + (isClosed ? " Z " : " ");
  }
  console.log(`Path ${i}: ${subpaths.map(s => rdp(s, epsilon).length).join("+")} pts`);
  newPaths.push(fullD.trim());
}
console.log(`Total points: ${totalPts}`);

// Bounding box
let allX = [], allY = [];
for (const d of newPaths) {
  const nums = d.match(/-?\d+(\.\d+)?/g);
  if (!nums) continue;
  for (let i = 0; i < nums.length - 1; i += 2) {
    allX.push(0.1 * parseFloat(nums[i]));
    allY.push(600 - 0.1 * parseFloat(nums[i + 1]));
  }
}
const minX = Math.min(...allX), maxX = Math.max(...allX);
const minY = Math.min(...allY), maxY = Math.max(...allY);
const size = Math.max(maxX - minX, maxY - minY);
const pad = size * 0.05, totalSize = size + 2 * pad;
const cx2 = (minX + maxX) / 2, cy2 = (minY + maxY) / 2;

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(cx2 - totalSize / 2)} ${r(cy2 - totalSize / 2)} ${r(totalSize)} ${r(totalSize)}">
  <g transform="translate(0,600) scale(0.1,-0.1)" fill="#1e3a5f" fill-rule="evenodd" stroke="none">
${newPaths.map(d => `    <path d="${d}"/>`).join("\n")}
  </g>
</svg>`;

writeFileSync("/Users/quinnngo/Desktop/vibecoding/yia-nextjs/public/favicon.svg", out);
console.log("Written simplified favicon.svg");
