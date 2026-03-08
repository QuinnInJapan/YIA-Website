/**
 * Convert markdown files in docs/ to styled HTML and PDF.
 *
 * Usage:
 *   node docs/md-to-html.mjs                    # converts all .md files in docs/
 *   node docs/md-to-html.mjs docs/specific.md   # converts a specific file
 *
 * Output: .html and .pdf files alongside each .md file.
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Minimal Markdown → HTML converter ---

function md(src) {
  const lines = src.split("\n");
  const out = [];
  let inList = null; // "ul" | "ol" | null
  let inBlockquote = false;
  let inTable = false;
  let tableRows = [];

  function flushList() {
    if (inList) { out.push(`</${inList}>`); inList = null; }
  }
  function flushBlockquote() {
    if (inBlockquote) { out.push("</blockquote>"); inBlockquote = false; }
  }
  function flushTable() {
    if (!inTable) return;
    inTable = false;
    out.push('<table>');
    tableRows.forEach((row, i) => {
      const tag = i === 0 ? "th" : "td";
      const cells = row.split("|").slice(1, -1).map(c => c.trim());
      out.push(`<tr>${cells.map(c => `<${tag}>${inline(c)}</${tag}>`).join("")}</tr>`);
    });
    out.push("</table>");
    tableRows = [];
  }

  function inline(text) {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Inline code
    text = text.replace(/`(.+?)`/g, '<span class="code">$1</span>');
    // Links
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      flushList();
      flushBlockquote();
      flushTable();
      continue;
    }

    // Table row
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      // Skip separator row
      if (/^\|[\s\-:|]+\|$/.test(line.trim())) {
        continue;
      }
      flushList();
      flushBlockquote();
      inTable = true;
      tableRows.push(line.trim());
      continue;
    } else {
      flushTable();
    }

    // Headings
    const hMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (hMatch) {
      flushList();
      flushBlockquote();
      const level = hMatch[1].length;
      out.push(`<h${level}>${inline(hMatch[2])}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushList();
      flushBlockquote();
      out.push("<hr>");
      continue;
    }

    // Blockquote
    if (line.startsWith("> ") || line.startsWith(">")) {
      flushList();
      if (!inBlockquote) { out.push("<blockquote>"); inBlockquote = true; }
      out.push(`<p>${inline(line.replace(/^>\s?/, ""))}</p>`);
      continue;
    } else {
      flushBlockquote();
    }

    // Checkbox list
    if (/^- \[[ x]\] /.test(line)) {
      if (inList !== "ul") { flushList(); out.push("<ul>"); inList = "ul"; }
      const checked = line.includes("[x]");
      const text = line.replace(/^- \[[ x]\]\s*/, "");
      out.push(`<li><span class="checkbox">${checked ? "☑" : "☐"}</span> ${inline(text)}</li>`);
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      if (inList !== "ul") { flushList(); out.push("<ul>"); inList = "ul"; }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      if (inList !== "ol") { flushList(); out.push("<ol>"); inList = "ol"; }
      out.push(`<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }

    flushList();

    // Arrow prefix (→)
    if (line.startsWith("→")) {
      out.push(`<p class="arrow">${inline(line)}</p>`);
      continue;
    }

    // Regular paragraph
    out.push(`<p>${inline(line)}</p>`);
  }

  flushList();
  flushBlockquote();
  flushTable();

  return out.join("\n");
}

// --- HTML template ---

function wrap(title, body) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
@page {
  size: A4;
  margin: 25mm 20mm 25mm 20mm;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif;
  font-size: 10.5pt;
  line-height: 1.9;
  color: #222;
  max-width: 210mm;
  margin: 0 auto;
  padding: 25mm 20mm;
}

/* --- Headings use spacing, not size --- */

h1 {
  font-size: 13pt;
  font-weight: 700;
  text-align: center;
  padding-bottom: 12pt;
  margin-bottom: 20pt;
  border-bottom: 1.5pt solid #333;
}

h2 {
  font-size: 11pt;
  font-weight: 700;
  margin-top: 24pt;
  margin-bottom: 8pt;
  padding: 4pt 8pt;
  background: #f0f0f0;
  border-left: 3pt solid #444;
}

h3 {
  font-size: 10.5pt;
  font-weight: 700;
  margin-top: 16pt;
  margin-bottom: 6pt;
}

h4 {
  font-size: 10.5pt;
  font-weight: 700;
  margin-top: 12pt;
  margin-bottom: 4pt;
}

/* --- Body text --- */

p {
  margin-bottom: 6pt;
  text-align: justify;
  text-justify: inter-ideograph;
}

strong {
  font-weight: 700;
}

/* --- Lists --- */

ul, ol {
  margin: 4pt 0 8pt 18pt;
}

li {
  margin-bottom: 3pt;
}

li > ul, li > ol {
  margin-top: 2pt;
  margin-bottom: 2pt;
}

/* --- Checkboxes --- */

.checkbox {
  margin-right: 4pt;
}

/* --- Tables --- */

table {
  width: 100%;
  border-collapse: collapse;
  margin: 8pt 0 12pt 0;
  font-size: 10pt;
}

th, td {
  border: 0.5pt solid #999;
  padding: 5pt 8pt;
  text-align: left;
  vertical-align: top;
}

th {
  background: #f0f0f0;
  font-weight: 700;
}

/* --- Blockquotes --- */

blockquote {
  margin: 8pt 0 8pt 12pt;
  padding: 6pt 12pt;
  border-left: 2pt solid #aaa;
  background: #fafafa;
}

blockquote p {
  margin-bottom: 2pt;
}

/* --- Horizontal rules --- */

hr {
  border: none;
  border-top: 0.5pt solid #ccc;
  margin: 16pt 0;
}

/* --- Misc --- */

.code {
  font-family: "Menlo", "Consolas", monospace;
  font-size: 9.5pt;
  background: #f4f4f4;
  padding: 1pt 3pt;
  border-radius: 2pt;
}

.arrow {
  margin-left: 12pt;
  margin-bottom: 6pt;
}

a {
  color: #222;
  text-decoration: underline;
}

@media print {
  body {
    padding: 0;
  }
  h2 {
    break-after: avoid;
  }
  h3 {
    break-after: avoid;
  }
  table {
    break-inside: avoid;
  }
}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

// --- Main ---

async function main() {
  const { chromium } = await import("playwright");

  const args = process.argv.slice(2);
  let files;

  if (args.length > 0) {
    files = args;
  } else {
    files = readdirSync(__dirname)
      .filter(f => f.endsWith(".md"))
      .map(f => join(__dirname, f));
  }

  // Build all HTML first
  const outputs = [];
  for (const file of files) {
    const src = readFileSync(file, "utf-8");
    const body = md(src);
    const titleMatch = src.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1].replace(/[*_`]/g, "") : basename(file, ".md");
    const html = wrap(title, body);
    const htmlPath = file.replace(/\.md$/, ".html");
    const pdfPath = file.replace(/\.md$/, ".pdf");
    writeFileSync(htmlPath, html);
    console.log(`${basename(file)} → ${basename(htmlPath)}`);
    outputs.push({ htmlPath, pdfPath, file });
  }

  // Generate PDFs with Playwright
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const { htmlPath, pdfPath, file } of outputs) {
    await page.goto(`file://${htmlPath}`, { waitUntil: "load" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      margin: { top: "25mm", right: "20mm", bottom: "25mm", left: "20mm" },
      displayHeaderFooter: false,
      printBackground: true,
    });
    console.log(`${basename(file)} → ${basename(pdfPath)}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
