# yia.jp scrape - 2026-06-18

Source site: http://yia.jp/

This folder is the step 1 archive for migrating Yokosuka International Association website content into Sanity. The goal is preservation first: raw page and asset files are kept as the source of truth, and extracted text/inventories are derived helper files.

## Summary

- HTML pages archived: 20
- Same-site assets archived: 125
- Images archived: 86
- PDFs archived: 31
- Old Office files archived: 8
- Crawl errors: 11, all recorded 404 responses from links exposed by the live site
- Approximate folder size: 92 MB

## Folder map

- `manifest.json` - crawl summary, page records, asset records, and fetch errors.
- `raw_html/` - original HTML bytes for every crawled page.
- `text/` - visible text extracted from each HTML page.
- `pages/` - one JSON metadata record per page, including title, meta tags, headings, links, assets, and text path.
- `assets/` - downloaded same-site files referenced by pages.
- `pdf_text/` - text extracted from PDF assets with `pdftotext -layout`.
- `pdf_inventory.json` - PDF extraction status, previews, and text sidecar paths.
- `image_inventory.json` - image dimensions, byte sizes, referring pages, and review flags.
- `image_candidates.txt` - quick list of images likely to contain text or page-relevant visual information.
- `manual_ocr/` - numbered contact sheets plus manual OCR sidecars for text-bearing images.
- `manual_ocr/manual_image_ocr.md` - human-readable manual transcription notes.
- `manual_ocr/manual_image_ocr.json` - structured manual OCR records keyed by image path and role.
- `office_text/` - text sidecars for linked old Office files.
- `office_inventory.json` - Office extraction status and limitations.
- `tools/` - crawler and regression test used to create this archive.

## Known limitations

- CSS was intentionally not retained as a first-class artifact. Images, PDFs, Excel files, and the Word file were retained.
- Tesseract is installed locally, but Japanese OCR language data is not installed. Automated image OCR was not used. Manual image OCR was added in `manual_ocr/manual_image_ocr.md` and `manual_ocr/manual_image_ocr.json`.
- PDF text extraction succeeded for all 31 PDFs.
- The single `.doc` file was converted with `textutil`.
- The 7 `.xls` files could not be parsed structurally because `xlrd`, LibreOffice, `ssconvert`, `xls2csv`, and an existing Node Excel parser were not available. Their `office_text/` sidecars are best-effort decoded strings only; use the original `.xls` files in `assets/` as authoritative.

## Crawl errors

The crawler records 11 fetch errors in `manifest.json`. They are 404s from internal links on the live site, not local extraction failures. Keep them for the later content audit because they may indicate outdated navigation or downloadable-file references.

## Verification commands

```bash
python3 manual/yia-jp-scrape-2026-06-18/tools/test_scrape_yia_site.py
python3 manual/yia-jp-scrape-2026-06-18/tools/scrape_yia_site.py
```
