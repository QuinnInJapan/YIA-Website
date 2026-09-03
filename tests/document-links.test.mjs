import assert from "node:assert/strict";
import test from "node:test";
import {
  documentTypeLabel,
  isPdfDocument,
  pdfViewerPath,
  safeViewerFileUrl,
} from "../lib/document-links.ts";

test("recognizes newly uploaded PDFs from fileType metadata", () => {
  const document = {
    label: [],
    type: "document",
    fileType: "PDF",
    file: { asset: { _ref: "file-example-pdf" } },
  };

  assert.equal(isPdfDocument(document), true);
  assert.equal(documentTypeLabel(document), "PDF");
});

test("infers a PDF from a file URL or Sanity asset ref", () => {
  assert.equal(isPdfDocument({ label: [], type: "document", url: "/files/guide.pdf?v=2" }), true);
  assert.equal(
    isPdfDocument({
      label: [],
      type: "document",
      file: { asset: { _ref: "file-example-pdf" } },
    }),
    true,
  );
});

test("keeps non-PDF file labels and types intact", () => {
  const document = { label: [], type: "document", fileType: "docx" };
  assert.equal(isPdfDocument(document), false);
  assert.equal(documentTypeLabel(document), "DOCX");
});

test("builds a same-origin viewer URL for a PDF tab", () => {
  const path = pdfViewerPath(
    "https://cdn.sanity.io/files/project/dataset/guide.pdf",
    "Guide / 案内",
  );
  const parsed = new URL(path, "https://yia.example");

  assert.equal(parsed.pathname, "/pdf-viewer");
  assert.equal(
    parsed.searchParams.get("file"),
    "https://cdn.sanity.io/files/project/dataset/guide.pdf",
  );
  assert.equal(parsed.searchParams.get("title"), "Guide / 案内");
});

test("viewer only accepts HTTP(S) and root-relative file URLs", () => {
  assert.equal(safeViewerFileUrl("/docs/guide.pdf"), "/docs/guide.pdf");
  assert.equal(
    safeViewerFileUrl("https://cdn.sanity.io/guide.pdf"),
    "https://cdn.sanity.io/guide.pdf",
  );
  assert.equal(safeViewerFileUrl("javascript:alert(1)"), undefined);
  assert.equal(safeViewerFileUrl("//example.com/guide.pdf"), undefined);
});
