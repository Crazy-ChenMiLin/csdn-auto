#!/usr/bin/env python3
"""
Test Xiaohongshu Cookie Login
Based on xhs-cookie-publisher skill
"""
import sys
import json
import time
from pathlib import Path

# Add playwright to path
sys.path.insert(0, '/home/node/site-packages')

from playwright.sync_api import sync_playwright

COOKIE_FILE = "/home/node/.openclaw/workspace/redbook.cookie/cookie.txt"
OUTPUT_DIR = "/home/node/.openclaw/workspace"

def normalize_cookies(raw_cookies):
    """Normalize browser-exported cookies for Playwright"""
    normalized = []
    for cookie in raw_cookies:
        nc = {
            "name": cookie["name"],
            "value": cookie["value"],
            "domain": cookie["domain"],
            "path": cookie.get("path", "/"),
        }
        
        # Convert expirationDate to expires (seconds to milliseconds)
        if cookie.get("expirationDate"):
            nc["expires"] = int(cookie["expirationDate"])
        
        # Handle sameSite
        same_site = cookie.get("sameSite")
        if same_site == "no_restriction":
            nc["sameSite"] = "None"
        elif same_site == "lax":
            nc["sameSite"] = "Lax"
        elif same_site == "strict":
            nc["sameSite"] = "Strict"
        # Omit sameSite if null
        
        # Handle httpOnly and secure
        if cookie.get("httpOnly"):
            nc["httpOnly"] = True
        if cookie.get("secure"):
            nc["secure"] = True
            
        normalized.append(nc)
    return normalized

def test_login():
    print("🚀 Starting Xiaohongshu Cookie Login Test")
    
    # Read cookies
    with open(COOKIE_FILE, 'r', encoding='utf-8') as f:
        raw_cookies = json.load(f)
    print(f"📄 Loaded {len(raw_cookies)} cookies from {COOKIE_FILE}")
    
    # Normalize cookies
    cookies = normalize_cookies(raw_cookies)
    
    with sync_playwright() as p:
        # Launch browser
        print("🌐 Launching Chromium...")
        browser = p.chromium.launch(
            headless=True,  # Headless mode
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        
        # Create context
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800}
        )
        
        # Inject cookies
        print("🍪 Injecting cookies...")
        context.add_cookies(cookies)
        
        # Open page
        page = context.new_page()
        
        # Step 1: Visit homepage
        print("🏠 Visiting xiaohongshu.com...")
        page.goto("https://www.xiaohongshu.com/", wait_until="networkidle")
        time.sleep(2)
        
        # Screenshot homepage
        home_screenshot = f"{OUTPUT_DIR}/xhs_homepage.png"
        page.screenshot(path=home_screenshot, full_page=True)
        print(f"📸 Homepage screenshot saved: {home_screenshot}")
        
        # Check for login modal
        login_modal = page.locator('text=短信登录').count() > 0 or \
                     page.locator('text=登录').count() > 0
        print(f"🔍 Homepage login modal detected: {login_modal}")
        
        # Step 2: Visit creator platform
        print("📱 Visiting creator platform...")
        page.goto(
            "https://creator.xiaohongshu.com/publish/publish?source=official&from=tab_switch&target=image",
            wait_until="networkidle"
        )
        time.sleep(3)
        
        # Check if redirected to login
        current_url = page.url
        is_login_page = "/login" in current_url
        print(f"🔗 Current URL: {current_url}")
        print(f"🔍 Is login page: {is_login_page}")
        
        # Screenshot publish page
        publish_screenshot = f"{OUTPUT_DIR}/xhs_publish_page.png"
        page.screenshot(path=publish_screenshot, full_page=True)
        print(f"📸 Publish page screenshot saved: {publish_screenshot}")
        
        # Check for upload element (indicates successful login)
        has_upload = page.locator('input[type=file]').count() > 0
        has_title_input = page.locator('input[placeholder="填写标题会有更多赞哦"]').count() > 0
        
        print(f"✅ Has upload input: {has_upload}")
        print(f"✅ Has title input: {has_title_input}")
        
        # Summary
        success = not is_login_page and (has_upload or has_title_input)
        print("\n" + "="*50)
        print("📊 TEST RESULTS:")
        print(f"  Homepage login modal: {login_modal}")
        print(f"  Publish is login page: {is_login_page}")
        print(f"  Has upload element: {has_upload}")
        print(f"  Has title input: {has_title_input}")
        print(f"  Overall Success: {'✅ YES' if success else '❌ NO'}")
        print("="*50)
        
        browser.close()
        return success

if __name__ == "__main__":
    try:
        success = test_login()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
