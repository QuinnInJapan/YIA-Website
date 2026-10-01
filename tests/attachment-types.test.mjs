import assert from "node:assert/strict";
import test from "node:test";
import {
  attachmentAssetUrl,
  attachmentAccept,
  supportedAttachment,
} from "../lib/attachment-types.ts";

test("resolves the published wakaba1 image reference instead of hiding its table link", () => {
  assert.equal(
    attachmentAssetUrl(
      "image-30dcb3b2fcd8b73d11caf649acdf3b631e9a20fb-3720x5262-jpg",
      "tarzpcp3",
      "production",
    ),
    "https://cdn.sanity.io/images/tarzpcp3/production/30dcb3b2fcd8b73d11caf649acdf3b631e9a20fb-3720x5262.jpg",
  );
});

test("preserves PDF, office download, and image-as-file URLs", () => {
  for (const ext of ["pdf", "doc", "docx", "jpg"]) {
    assert.equal(
      attachmentAssetUrl(`file-example-${ext}`, "project", "development"),
      `https://cdn.sanity.io/files/project/development/example.${ext}`,
    );
  }
  for (const ref of [undefined, "", "image-invalid-jpg", "not-an-asset", "file-../../bad-pdf"]) {
    assert.equal(attachmentAssetUrl(ref, "project", "development"), "");
  }
});

test("accepts supported images with uppercase filenames or missing browser MIME types", () => {
  assert.equal(supportedAttachment({ name: "wakaba1.JPG", type: "image/jpeg" }, "images"), true);
  assert.equal(supportedAttachment({ name: "flyer.webp", type: "" }, "images"), true);
  assert.equal(supportedAttachment({ name: "flyer.avif", type: "application/octet-stream" }), true);
});

test("enforces active picker filters and rejects unsupported or mismatched uploads", () => {
  assert.equal(attachmentAccept("pdf"), ".pdf");
  assert.equal(attachmentAccept("images").includes(".jpg"), true);
  assert.equal(attachmentAccept().includes("*"), false);
  assert.equal(supportedAttachment({ name: "guide.pdf", type: "application/pdf" }), true);
  assert.equal(supportedAttachment({ name: "form.doc", type: "application/msword" }, "docs"), true);
  for (const [name, type, filter] of [
    ["photo.heic", "image/heic", "all"],
    ["photo.tiff", "image/tiff", "images"],
    ["page.html", "text/html", "all"],
    ["script.svg", "image/svg+xml", "all"],
    ["guide.pdf", "application/pdf", "images"],
    ["photo.jpg", "image/jpeg", "docs"],
    ["fake.jpg", "text/html", "all"],
    ["no-extension", "image/jpeg", "all"],
  ])
    assert.equal(supportedAttachment({ name, type }, filter), false, name);
});
