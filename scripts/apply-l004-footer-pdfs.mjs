import fs from "node:fs";
import path from "node:path";
import {
  fail,
  getOrUploadFileAsset,
  i18n,
  logSummary,
  patchWithRevision,
  runSanityScript,
} from "./lib/sanity-tools.mjs";

const DOWNLOAD_DIR = "/private/tmp/yia-l004-footer-pdfs";
const SOURCE_BASE = "http://yia.jp";

const DOCUMENTS = [
  {
    key: "key16",
    filename: "teikan.pdf",
    labelJa: "定款",
    labelEn: "Articles of Incorporation",
  },
  {
    key: "key17",
    filename: "2026yakuin.pdf",
    labelJa: "令和８年度役員紹介",
    labelEn: "FY2026 Board Members",
  },
  {
    key: "key18",
    filename: "20261go.pdf",
    labelJa: "令和７年度事業報告",
    labelEn: "FY2025 Business Report",
  },
  {
    key: "key19",
    filename: "20262go.pdf",
    labelJa: "令和７年度決算報告",
    labelEn: "FY2025 Financial Report",
  },
  {
    key: "key20",
    filename: "2026taishakutaisho.pdf",
    labelJa: "令和７年度貸借対照表",
    labelEn: "FY2025 Balance Sheet",
  },
  {
    key: "key21",
    filename: "20263go.pdf",
    labelJa: "令和８年度事業計画案",
    labelEn: "FY2026 Business Plan",
  },
  {
    key: "key22",
    filename: "20264go.pdf",
    labelJa: "令和８年度活動予算案",
    labelEn: "FY2026 Activity Budget",
  },
];

runSanityScript({
  name: "Apply L-004 footer PDFs",
  description:
    "Download the latest public-document PDFs from yia.jp, upload them to Sanity, and wire them into sidebar footer documents.",
  handler: async ({ client, dryRun }) => {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

    const assetsByKey = new Map();
    for (const doc of DOCUMENTS) {
      const localPath = path.join(DOWNLOAD_DIR, doc.filename);
      await downloadPdf(`${SOURCE_BASE}/${doc.filename}`, localPath);
      const asset = await getOrUploadFileAsset(client, localPath, {
        dryRun,
        filename: doc.filename,
        contentType: "application/pdf",
      });
      assetsByKey.set(doc.key, asset);
    }

    const sidebars = await client.fetch(
      `*[_type == "sidebar" && _id in ["sidebar", "drafts.sidebar"]]{
        _id,
        _rev,
        documents
      }`,
    );

    if (!sidebars?.length) {
      throw fail("Could not find the Sanity sidebar document.", {
        fix: "Confirm the sidebar singleton exists before patching footer documents.",
      });
    }

    let patched = 0;
    let skippedUnchanged = 0;
    const patchedDocs = [];

    for (const sidebar of sidebars) {
      const documents = patchDocuments(sidebar.documents, assetsByKey);
      if (documentsEqual(sidebar.documents, documents)) {
        skippedUnchanged += 1;
        continue;
      }

      await patchWithRevision(client, sidebar, { documents }, { dryRun });
      patched += 1;
      patchedDocs.push(sidebar._id);
    }

    logSummary({
      dryRun,
      downloaded: DOCUMENTS.length,
      uploadedOrReused: assetsByKey.size,
      patched,
      skippedUnchanged,
      patchedDocs,
    });
  },
});

function patchDocuments(existingDocuments, assetsByKey) {
  const byKey = new Map((existingDocuments ?? []).map((item) => [item._key, item]));

  return DOCUMENTS.map((doc) => {
    const asset = assetsByKey.get(doc.key);
    const assetRef = asset?._id ?? dryRunAssetRef(asset);
    if (!assetRef) {
      throw fail("Missing uploaded Sanity file asset.", {
        fix: "Check the upload result before patching sidebar documents.",
        context: { key: doc.key, filename: doc.filename, asset },
      });
    }

    const current = byKey.get(doc.key) ?? { _key: doc.key };
    return {
      ...current,
      label: i18n(doc.labelJa, doc.labelEn),
      file: {
        _type: "file",
        asset: {
          _type: "reference",
          _ref: assetRef,
        },
      },
      url: null,
      type: "PDF",
      fileType: "PDF",
    };
  });
}

function dryRunAssetRef(asset) {
  if (!asset?.dryRun || !asset.sha1hash) return undefined;
  return `file-${asset.sha1hash}-pdf`;
}

function documentsEqual(current = [], desired = []) {
  if (current.length !== desired.length) return false;

  return desired.every((desiredItem, index) => {
    const currentItem = current[index];
    return (
      currentItem?._key === desiredItem._key &&
      valueFor(currentItem.label, "ja") === valueFor(desiredItem.label, "ja") &&
      valueFor(currentItem.label, "en") === valueFor(desiredItem.label, "en") &&
      currentItem?.file?.asset?._ref === desiredItem.file.asset._ref &&
      (currentItem?.url ?? null) === (desiredItem.url ?? null) &&
      currentItem?.type === desiredItem.type &&
      currentItem?.fileType === desiredItem.fileType
    );
  });
}

function valueFor(field, key) {
  return field?.find((entry) => entry._key === key)?.value ?? "";
}

async function downloadPdf(url, outputPath) {
  if (fs.existsSync(outputPath)) {
    assertPdf(outputPath);
    console.log(`Using downloaded PDF: ${outputPath}`);
    return;
  }

  const response = await fetch(url);
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("pdf")) {
    throw fail("Source URL did not return a PDF.", {
      fix: "Confirm the yia.jp table link and update the source URL.",
      context: { url, status: response.status, contentType },
    });
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, bytes);
  assertPdf(outputPath);
  console.log(`Downloaded PDF: ${url}`);
}

function assertPdf(filePath) {
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(5);
  fs.readSync(fd, buffer, 0, 5, 0);
  fs.closeSync(fd);
  const header = buffer.toString("utf8");
  if (header !== "%PDF-") {
    throw fail("Downloaded file is not a PDF.", {
      fix: "Delete the bad local file and rerun after confirming the source URL.",
      context: { filePath, header },
    });
  }
}
