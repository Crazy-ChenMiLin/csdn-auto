#!/usr/bin/env python3
"""Test Playwright installation"""
import sys
sys.path.insert(0, '/home/node/site-packages')

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    print(f"Playwright version: {p.chromium.__class__.__module__.split('.')[0]}")
    print(f"Chromium path: {p.chromium.executable_path}")
    print("✅ Playwright is working!")
