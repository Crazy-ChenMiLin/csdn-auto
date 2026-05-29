#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/node/site-packages')

import json
from playwright.sync_api import sync_playwright

COOKIE_FILE = "/home/node/.openclaw/workspace/redbook.cookie/cookie.txt"
OUTPUT_DIR = "/home/node/.openclaw/workspace"

def normalize_cookies(raw_cookies):
    normalized = []
    for cookie in raw_cookies:
        nc = {
            "name": cookie["name"],
            "value": cookie["value"],
            "domain": cookie["domain"],
            "path": cookie.get("path", "/"),
        }
        if cookie.get("expirationDate"):
            nc["expires"] = int(cookie["expirationDate"])
        same_site = cookie.get("sameSite")
        if same_site == "no_restriction":
            nc["sameSite"] = "None"
        elif same_site == "lax":
            nc["sameSite"] = "Lax"
        elif same_site == "strict":
            nc["sameSite"] = "Strict"
        if cookie.get("httpOnly"):
            nc["httpOnly"] = True
        if cookie.get("secure"):
            nc["secure"] = True
        normalized.append(nc)
    return normalized

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
    
    with open(COOKIE_FILE, 'r') as f:
        cookies = normalize_cookies(json.load(f))
    
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    context.add_cookies(cookies)
    
    page = context.new_page()
    page.goto("https://creator.xiaohongshu.com/publish/publish?source=official&from=tab_switch&target=image", 
              wait_until="networkidle")
    
    # Wait a bit for page to fully render
    page.wait_for_timeout(5000)
    
    print("🔍 Checking page elements:")
    print(f"   URL: {page.url}")
    print(f"   Title: {page.title()}")
    
    # Check various selectors
    selectors = [
        "input[type=file]",
        'input[placeholder="填写标题会有更多赞哦"]',
        '[contenteditable="true"]',
        "text=上传图片",
        "text=图文发布",
        "text=发布笔记",
        ".upload",
        "[class*='upload']",
        "[class*='publish']"
    ]
    
    for sel in selectors:
        count = page.locator(sel).count()
        print(f"   '{sel}': {count} found")
    
    # Get page text content
    text = page.locator("body").inner_text()[:500]
    print(f"\n📄 Page text preview:\n{text}...")
    
    page.screenshot(path=f"{OUTPUT_DIR}/xhs_debug_publish.png", full_page=True)
    print(f"\n📸 Screenshot saved: xhs_debug_publish.png")
    
    browser.close()
