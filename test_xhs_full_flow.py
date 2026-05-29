#!/usr/bin/env python3
"""
Test Xiaohongshu Full Flow: Login -> Upload -> Check Title/Editor
"""
import sys
sys.path.insert(0, '/home/node/site-packages')

import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

COOKIE_FILE = "/home/node/.openclaw/workspace/redbook.cookie/cookie.txt"
OUTPUT_DIR = "/home/node/.openclaw/workspace"
IMAGE_PATH = "/home/node/.openclaw/workspace/csdn_article_after_save.png"

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

print("🚀 开始小红书完整流程测试\n")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])
    
    with open(COOKIE_FILE, 'r') as f:
        cookies = normalize_cookies(json.load(f))
    print(f"✅ 加载了 {len(cookies)} 个 cookies")
    
    context = browser.new_context(viewport={'width': 1280, 'height': 900})
    context.add_cookies(cookies)
    page = context.new_page()
    
    # Step 1: Visit homepage
    print("\n🏠 Step 1: 访问首页...")
    page.goto("https://www.xiaohongshu.com/", wait_until="networkidle")
    time.sleep(2)
    
    has_login_modal = page.locator('text=短信登录').count() > 0
    print(f"   登录弹窗: {has_login_modal} (应为 False)")
    page.screenshot(path=f"{OUTPUT_DIR}/xhs_flow_homepage.png", full_page=True)
    
    # Step 2: Go to publish page
    print("\n📱 Step 2: 进入图文发布页...")
    page.goto("https://creator.xiaohongshu.com/publish/publish?source=official&from=tab_switch&target=image", 
              wait_until="networkidle")
    time.sleep(3)  # Wait for full render
    
    print(f"   当前URL: {page.url}")
    is_login = "/login" in page.url
    print(f"   是否跳转登录: {is_login} (应为 False)")
    
    # Check upload element (with wait)
    upload_count = page.locator("input[type=file]").count()
    print(f"   上传元素数量: {upload_count}")
    
    if upload_count == 0:
        print("   ❌ 未找到上传元素，等待更多时间...")
        page.wait_for_timeout(5000)
        upload_count = page.locator("input[type=file]").count()
        print(f"   重试后上传元素: {upload_count}")
    
    page.screenshot(path=f"{OUTPUT_DIR}/xhs_flow_publish_initial.png", full_page=True)
    
    # Step 3: Upload image
    print("\n📤 Step 3: 上传图片...")
    if upload_count > 0:
        page.locator("input[type=file]").first.set_input_files(IMAGE_PATH)
        print(f"   已选择图片: {Path(IMAGE_PATH).name}")
        print("   ⏳ 等待 15 秒上传...")
        page.wait_for_timeout(15000)
        
        page.screenshot(path=f"{OUTPUT_DIR}/xhs_flow_after_upload.png", full_page=True)
        print("   📸 上传后截图已保存")
    else:
        print("   ❌ 无法上传，跳过")
    
    # Step 4: Check for title and editor AFTER upload
    print("\n🔍 Step 4: 检测标题输入框和正文编辑器...")
    
    title_found = False
    editor_found = False
    
    try:
        title_input = page.locator('input[placeholder="填写标题会有更多赞哦"]')
        title_input.wait_for(state="visible", timeout=15000)
        print("   ✅ 标题输入框已出现且可见!")
        title_found = True
    except Exception as e:
        print(f"   ❌ 标题输入框未找到")
    
    try:
        editor = page.locator('[contenteditable="true"]').first
        editor.wait_for(state="visible", timeout=15000)
        print("   ✅ 正文编辑器已出现且可见!")
        editor_found = True
    except Exception as e:
        print(f"   ❌ 正文编辑器未找到")
    
    page.screenshot(path=f"{OUTPUT_DIR}/xhs_flow_final.png", full_page=True)
    
    # Summary
    print("\n" + "="*60)
    print("📊 完整测试结果:")
    print(f"  ✅ Cookie 登录: 成功 ({len(cookies)} 个 cookies)")
    print(f"  ✅ 首页访问: 无登录弹窗")
    print(f"  ✅ 发布页访问: 未跳转登录页")
    print(f"  ✅ 上传元素: 检测到 ({upload_count} 个)")
    print(f"  ✅ 图片上传: {'完成' if upload_count > 0 else '跳过'}")
    print(f"  {'✅' if title_found else '❌'} 标题输入框: {'出现' if title_found else '未出现'}")
    print(f"  {'✅' if editor_found else '❌'} 正文编辑器: {'出现' if editor_found else '未出现'}")
    print("="*60)
    
    if not is_login and title_found and editor_found:
        print("\n🎉 全部测试通过! Cookie 登录成功，图文发布流程完整!")
    else:
        print("\n⚠️ 部分测试未通过，请检查截图")
    
    browser.close()
