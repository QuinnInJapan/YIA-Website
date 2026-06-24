#!/usr/bin/env python3
"""Polite same-site crawler for archiving yia.jp page evidence.

Outputs:
- raw_html/: original HTML bytes for each crawled HTML page
- text/: visible text snapshots extracted from each HTML page
- pages/: per-page metadata JSON with links, images, headings, and meta tags
- assets/: same-site non-HTML assets referenced by pages, including images
- manifest.json: crawl summary and URL-to-file index
"""

from __future__ import annotations

import hashlib
import json
import mimetypes
import re
import sys
import time
from collections import deque
from dataclasses import dataclass, field
from email.message import Message
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urldefrag, urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen


START_URL = "http://yia.jp/"
ALLOWED_HOSTS = {"yia.jp", "www.yia.jp"}
USER_AGENT = "Codex archival crawler for yia-nextjs metadata migration (+local manual scrape)"
REQUEST_DELAY_SECONDS = 0.25
MAX_PAGES = 2000
MAX_ASSETS = 5000
TIMEOUT_SECONDS = 30

ROOT = Path(__file__).resolve().parents[1]
RAW_HTML_DIR = ROOT / "raw_html"
TEXT_DIR = ROOT / "text"
PAGES_DIR = ROOT / "pages"
ASSETS_DIR = ROOT / "assets"

NON_PAGE_EXTENSIONS = {
    ".7z",
    ".avi",
    ".css",
    ".csv",
    ".doc",
    ".docx",
    ".eot",
    ".gif",
    ".gz",
    ".heic",
    ".ico",
    ".jpeg",
    ".jpg",
    ".js",
    ".json",
    ".map",
    ".mov",
    ".mp3",
    ".mp4",
    ".odp",
    ".ods",
    ".odt",
    ".pdf",
    ".png",
    ".ppt",
    ".pptx",
    ".rar",
    ".svg",
    ".tar",
    ".tif",
    ".tiff",
    ".ttf",
    ".txt",
    ".webm",
    ".webp",
    ".woff",
    ".woff2",
    ".xls",
    ".xlsx",
    ".xml",
    ".zip",
}

IMAGE_EXTENSIONS = {
    ".gif",
    ".heic",
    ".ico",
    ".jpeg",
    ".jpg",
    ".png",
    ".svg",
    ".tif",
    ".tiff",
    ".webp",
}


def ensure_dirs() -> None:
    for path in (RAW_HTML_DIR, TEXT_DIR, PAGES_DIR, ASSETS_DIR):
        path.mkdir(parents=True, exist_ok=True)


def host_key(host: str | None) -> str:
    return (host or "").lower().removeprefix("www.")


def normalize_url(url: str, base: str | None = None) -> str | None:
    if not url:
        return None
    absolute = urljoin(base or START_URL, url.strip())
    absolute, _fragment = urldefrag(absolute)
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"}:
        return None
    if host_key(parsed.netloc) != "yia.jp":
        return None

    path = quote(parsed.path or "/", safe="/%:@")
    query = quote(parsed.query, safe="=&?/:;+,%@")
    # Keep query strings because some older CMS pages use them as page identity.
    normalized = parsed._replace(
        scheme=parsed.scheme.lower(),
        netloc=parsed.netloc.lower(),
        path=path,
        query=query,
        fragment="",
    )
    return urlunparse(normalized)


def extension_for_url(url: str) -> str:
    parsed = urlparse(url)
    return Path(parsed.path).suffix.lower()


def is_probable_asset(url: str) -> bool:
    return extension_for_url(url) in NON_PAGE_EXTENSIONS


def parse_srcset(value: str) -> list[str]:
    urls: list[str] = []
    for item in value.split(","):
        part = item.strip().split()
        if part:
            urls.append(part[0])
    return urls


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[str] = []
        self.images: list[dict[str, str]] = []
        self.assets: list[str] = []
        self.meta: list[dict[str, str]] = []
        self.text_chunks: list[str] = []
        self.title_chunks: list[str] = []
        self.heading_chunks: list[dict[str, str]] = []
        self._skip_depth = 0
        self._tag_stack: list[str] = []
        self._current_heading: str | None = None
        self._current_heading_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attr = {k.lower(): v for k, v in attrs if k and v}
        self._tag_stack.append(tag)

        if tag in {"script", "style", "noscript"}:
            self._skip_depth += 1

        if tag in {"a", "area"} and "href" in attr:
            self.links.append(attr["href"])
        elif tag in {"iframe", "frame"} and "src" in attr:
            self.links.append(attr["src"])
        elif tag == "form" and "action" in attr:
            self.links.append(attr["action"])

        if tag == "img":
            record: dict[str, str] = {}
            for key in ("src", "alt", "title"):
                if key in attr:
                    record[key] = attr[key]
            if "src" in attr:
                self.assets.append(attr["src"])
            if "srcset" in attr:
                for url in parse_srcset(attr["srcset"]):
                    self.assets.append(url)
            if record:
                self.images.append(record)
            if attr.get("alt"):
                self.text_chunks.append(attr["alt"])

        if tag in {"source", "video", "audio", "embed", "object"}:
            for key in ("src", "data", "poster"):
                if key in attr:
                    self.assets.append(attr[key])
            if "srcset" in attr:
                for url in parse_srcset(attr["srcset"]):
                    self.assets.append(url)

        if tag == "link" and "href" in attr:
            rel = attr.get("rel", "")
            if any(token in rel.lower() for token in ("icon", "preload", "image_src")):
                self.assets.append(attr["href"])

        if tag == "meta" and "content" in attr:
            key = attr.get("name") or attr.get("property") or attr.get("http-equiv")
            if key:
                self.meta.append({"key": key, "content": attr["content"]})

        if re.fullmatch(r"h[1-6]", tag):
            self._current_heading = tag
            self._current_heading_text = []

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "noscript"} and self._skip_depth:
            self._skip_depth -= 1
        if self._current_heading == tag:
            text = clean_text(" ".join(self._current_heading_text))
            if text:
                self.heading_chunks.append({"level": tag, "text": text})
            self._current_heading = None
            self._current_heading_text = []
        if self._tag_stack:
            self._tag_stack.pop()

    def handle_data(self, data: str) -> None:
        text = clean_text(data)
        if not text or self._skip_depth:
            return
        if self._tag_stack and self._tag_stack[-1] == "title":
            self.title_chunks.append(text)
        if self._current_heading:
            self._current_heading_text.append(text)
        self.text_chunks.append(text)


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def unique_preserve_order(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


def safe_name(url: str, suffix: str) -> str:
    parsed = urlparse(url)
    raw_path = parsed.path.strip("/") or "index"
    if raw_path.endswith("/"):
        raw_path += "index"
    if parsed.query:
        raw_path += "__query_" + hashlib.sha1(parsed.query.encode("utf-8")).hexdigest()[:10]
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", raw_path.replace("/", "__")).strip("._-")
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:10]
    if not stem:
        stem = "page"
    max_stem = 170
    return f"{stem[:max_stem]}__{digest}{suffix}"


def decode_html(body: bytes, headers: Message) -> str:
    charset = headers.get_content_charset()
    if charset:
        try:
            return body.decode(charset, errors="replace")
        except LookupError:
            pass
    head = body[:4096].decode("ascii", errors="ignore")
    match = re.search(r"charset=[\"']?([A-Za-z0-9._-]+)", head, flags=re.I)
    if match:
        try:
            return body.decode(match.group(1), errors="replace")
        except LookupError:
            pass
    return body.decode("utf-8", errors="replace")


@dataclass
class FetchResult:
    url: str
    status: int | None
    content_type: str | None = None
    headers: dict[str, str] = field(default_factory=dict)
    body: bytes = b""
    error: str | None = None


def fetch(url: str) -> FetchResult:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            headers = response.headers
            body = response.read()
            return FetchResult(
                url=response.geturl(),
                status=response.status,
                content_type=headers.get_content_type(),
                headers={k: v for k, v in headers.items()},
                body=body,
            )
    except HTTPError as exc:
        body = exc.read() if exc.fp else b""
        return FetchResult(
            url=url,
            status=exc.code,
            content_type=exc.headers.get_content_type() if exc.headers else None,
            headers={k: v for k, v in (exc.headers or {}).items()},
            body=body,
            error=str(exc),
        )
    except (URLError, TimeoutError, OSError) as exc:
        return FetchResult(url=url, status=None, error=str(exc))


def save_asset(url: str, result: FetchResult) -> dict[str, object]:
    content_type = result.content_type or "application/octet-stream"
    ext = extension_for_url(url)
    if not ext:
        ext = mimetypes.guess_extension(content_type) or ".bin"
    filename = safe_name(url, ext)
    path = ASSETS_DIR / filename
    path.write_bytes(result.body)
    return {
        "url": url,
        "final_url": result.url,
        "status": result.status,
        "content_type": content_type,
        "bytes": len(result.body),
        "path": str(path.relative_to(ROOT)),
        "is_image": ext.lower() in IMAGE_EXTENSIONS or content_type.startswith("image/"),
    }


def save_page(url: str, result: FetchResult) -> tuple[dict[str, object], list[str], list[str]]:
    html = decode_html(result.body, Message())
    # Parse with the response headers when possible for a better charset.
    html = decode_html(result.body, _headers_message(result.headers))

    parser = PageParser()
    parser.feed(html)

    title = clean_text(" ".join(parser.title_chunks))
    text = "\n".join(unique_preserve_order(clean_text(chunk) for chunk in parser.text_chunks if clean_text(chunk)))

    page_name = safe_name(url, ".html")
    raw_path = RAW_HTML_DIR / page_name
    raw_path.write_bytes(result.body)

    text_path = TEXT_DIR / page_name.replace(".html", ".txt")
    text_path.write_text(text + "\n", encoding="utf-8")

    normalized_links = [
        normalized
        for link in parser.links
        if (normalized := normalize_url(link, url))
    ]
    normalized_assets = [
        normalized
        for asset in parser.assets
        if (normalized := normalize_url(asset, url))
    ]

    page_assets = unique_preserve_order(normalized_assets)
    page_links = unique_preserve_order(normalized_links)
    page_record: dict[str, object] = {
        "url": url,
        "final_url": result.url,
        "status": result.status,
        "content_type": result.content_type,
        "headers": result.headers,
        "title": title,
        "meta": parser.meta,
        "headings": parser.heading_chunks,
        "raw_html_path": str(raw_path.relative_to(ROOT)),
        "text_path": str(text_path.relative_to(ROOT)),
        "text_characters": len(text),
        "links": page_links,
        "assets": page_assets,
        "images": parser.images,
    }

    page_json_path = PAGES_DIR / page_name.replace(".html", ".json")
    page_json_path.write_text(json.dumps(page_record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    linked_pages = [link for link in page_links if not is_probable_asset(link)]
    linked_assets = [link for link in page_links if is_probable_asset(link)]
    linked_assets.extend(page_assets)
    return page_record, unique_preserve_order(linked_pages), unique_preserve_order(linked_assets)


def _headers_message(headers: dict[str, str]) -> Message:
    message = Message()
    for key, value in headers.items():
        message[key] = value
    return message


def load_sitemap_urls() -> list[str]:
    urls: list[str] = []
    for sitemap_url in ("http://yia.jp/sitemap.xml", "https://yia.jp/sitemap.xml"):
        result = fetch(sitemap_url)
        if result.status and 200 <= result.status < 300 and result.body:
            text = result.body.decode("utf-8", errors="replace")
            urls.extend(re.findall(r"<loc>\s*([^<]+?)\s*</loc>", text, flags=re.I))
    return [url for url in (normalize_url(url) for url in urls) if url]


def main() -> int:
    ensure_dirs()
    pages_seen: set[str] = set()
    assets_seen: set[str] = set()
    page_queue: deque[str] = deque([START_URL])
    asset_queue: deque[str] = deque()
    errors: list[dict[str, object]] = []
    page_records: list[dict[str, object]] = []
    asset_records: list[dict[str, object]] = []

    for sitemap_url in load_sitemap_urls():
        if sitemap_url not in page_queue:
            page_queue.append(sitemap_url)

    while page_queue and len(pages_seen) < MAX_PAGES:
        url = page_queue.popleft()
        normalized_url = normalize_url(url)
        if not normalized_url or normalized_url in pages_seen:
            continue
        pages_seen.add(normalized_url)
        time.sleep(REQUEST_DELAY_SECONDS)

        result = fetch(normalized_url)
        if result.error or not result.status or result.status >= 400:
            errors.append({"url": normalized_url, "status": result.status, "error": result.error})
            continue

        content_type = result.content_type or ""
        if "html" not in content_type and not normalized_url.endswith(("/", ".php", ".htm", ".html")):
            asset_queue.append(normalized_url)
            continue

        page_record, linked_pages, linked_assets = save_page(normalized_url, result)
        page_records.append(page_record)

        for linked_page in linked_pages:
            if linked_page not in pages_seen and len(pages_seen) + len(page_queue) < MAX_PAGES:
                page_queue.append(linked_page)
        for linked_asset in linked_assets:
            if linked_asset not in assets_seen and len(assets_seen) + len(asset_queue) < MAX_ASSETS:
                asset_queue.append(linked_asset)

    while asset_queue and len(assets_seen) < MAX_ASSETS:
        url = asset_queue.popleft()
        normalized_url = normalize_url(url)
        if not normalized_url or normalized_url in assets_seen:
            continue
        assets_seen.add(normalized_url)
        time.sleep(REQUEST_DELAY_SECONDS)

        result = fetch(normalized_url)
        if result.error or not result.status or result.status >= 400:
            errors.append({"url": normalized_url, "status": result.status, "error": result.error})
            continue
        if (result.content_type or "").startswith("text/html"):
            # If an asset-looking URL returns HTML, keep it as a page too.
            if normalized_url not in pages_seen and len(pages_seen) < MAX_PAGES:
                page_queue.append(normalized_url)
            continue
        asset_records.append(save_asset(normalized_url, result))

    manifest = {
        "start_url": START_URL,
        "allowed_hosts": sorted(ALLOWED_HOSTS),
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "request_delay_seconds": REQUEST_DELAY_SECONDS,
        "page_count": len(page_records),
        "asset_count": len(asset_records),
        "error_count": len(errors),
        "pages": page_records,
        "assets": asset_records,
        "errors": errors,
        "limits": {"max_pages": MAX_PAGES, "max_assets": MAX_ASSETS},
    }
    (ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Scraped {len(page_records)} pages and {len(asset_records)} assets "
        f"with {len(errors)} errors into {ROOT}"
    )
    if page_queue:
        print(f"WARNING: page queue still had {len(page_queue)} URLs when crawl stopped", file=sys.stderr)
    if asset_queue:
        print(f"WARNING: asset queue still had {len(asset_queue)} URLs when crawl stopped", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
