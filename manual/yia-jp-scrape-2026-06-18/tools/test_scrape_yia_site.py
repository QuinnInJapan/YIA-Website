#!/usr/bin/env python3
"""Regression tests for the yia.jp archival crawler."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name("scrape_yia_site.py")


def load_crawler_module():
    spec = importlib.util.spec_from_file_location("scrape_yia_site", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class NormalizeUrlTest(unittest.TestCase):
    def test_percent_encodes_spaces_in_same_site_asset_paths(self) -> None:
        crawler = load_crawler_module()

        normalized = crawler.normalize_url(
            "/top/09aboutyia/kaiinn/kaiintouroku eigo2.xls",
            "http://yia.jp/",
        )

        self.assertEqual(
            normalized,
            "http://yia.jp/top/09aboutyia/kaiinn/kaiintouroku%20eigo2.xls",
        )


if __name__ == "__main__":
    unittest.main()
