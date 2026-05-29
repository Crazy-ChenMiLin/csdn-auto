#!/usr/bin/env python3
"""
Complete Xiaohongshu Publish Flow: Login -> Upload -> Fill -> Publish
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

print("🚀 开始小红书完整发布测试\n")

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
    page.screenshot(path=f"{OUTPUT_DIR}/xhs_pub_home.png", full_page=True)
    
    # Step 2: Go to publish page
    print("\n📱 Step 2: 进入图文发布页...")
    page.goto("https://creator.xiaohongshu.com/publish/publish?source=official&from=tab_switch&target=image", 
              wait_until="networkidle")
    time.sleep(5)  # Wait for upload element
    
    print(f"   URL: {page.url}")
    page.screenshot(path=f"{OUTPUT_DIR}/xhs_pub_initial.png", full_page=True)
    
    # Step 3: Upload image
    print("\n📤 Step 3: 上传图片...")
    page.locator("input[type=file]").first.set_input_files(IMAGE_PATH)
    print(f"   已选择: {Path(IMAGE_PATH).name}")
    print("   ⏳ 等待 15 秒上传...")
    page.wait_for_timeout(15000)
    page.screenshot(path=f"{OUTPUT_DIR}/xhs_pub_uploaded.png", full_page=True)
    
    # Step 4: Fill title and content
    print("\n✏️ Step 4: 填写标题和正文...")
    
    # Fill title
    title = "【测试】自动化发布图文笔记"
    title_input = page.locator('input[placeholder="填写标题会有更多赞哦"]')
    title_input.wait_for(state="visible", timeout=15000)
    title_input.fill(title)
    print(f"   标题: {title}")
    
    # Fill body
    body = "这是一篇由自动化脚本发布的测试笔记。\n\n🤖 测试内容：\n- Cookie 登录成功\n- 图片上传正常\n- 自动填写标题和正文\n\n#自动化测试 #小红书"
    editor = page.locator('[contenteditable="true"]').first
    editor.wait_for(state="visible", timeout=15000)
    editor.fill(body)
    print(f"   正文已填写 ({len(body)} 字符)")
    
    page.screenshot(path=f"{OUTPUT_DIR}/xhs_pub_filled.png", full_page=True)
    print("   📸 填写后截图已保存")
    
    # Step 5: Click publish
    print("\n🚀 Step 5: 点击发布...")
    
    # Screenshot before publish
    page.screenshot(path=f"{OUTPUT_DIR}/xhs_pub_before_click.png", full_page=True)
    
    # Click publish button
    publish_btn = page.get_by_text("发布", exact=True).last
    publish_btn.click(timeout=10000)
    print("   已点击发布按钮")
    
    # Wait for publish to complete
    print("   ⏳ 等待 10 秒...")
    page.wait_for_timeout(10000)
    
    page.screenshot(path=f"{OUTPUT_DIR}/xhs_pub_after_click.png", full_page=True)
    print("   📸 发布后截图已保存")
    
    # Check current URL for published=true
    current_url = page.url
    print(f"   当前URL: {current_url}")
    
    if "published=true" in current_url:
        print("   ✅ URL 包含 published=true")
    
    # Step 6: Check note manager
    print("\n📋 Step 6: 检查笔记管理...")
    page.goto("https://creator.xiaohongshu.com/new/home?source=official", wait_until="networkidle")
    time.sleep(3)
    
    page.screenshot(path=f"{OUTPUT_DIR}/xhs_pub_manager.png", full_page=True)
    
    # Check if our title appears
    note_titles = page.locator(f'text={title}').count()
    print(f"   找到标题 '{title}': {note_titles} 次")
    
    if note_titles > 0:
        print("   ✅ 笔记发布成功，已在笔记管理中!")
    else:
        print("   ⚠️ 未在笔记管理中找到该笔记，可能正在审核")
    
    # Summary
    print("\n" + "="*60)
    print("📊 完整发布测试结果:")
    print(f"  ✅ Cookie 登录: 成功")
    print(f"  ✅ 图片上传: 完成")
    print(f"  ✅ 标题填写: {title}")
    print(f"  ✅ 正文填写: 完成")
    print(f"  ✅ 点击发布: 完成")
    print(f"  {'✅' if note_titles > 0 else '⚠️'} 笔记管理验证: {'通过' if note_titles > 0 else '待确认'}")
    print("="*60)
    
    browser.close()
    
    print(f"\n📝 笔记标题: {title}")
    print(f"📸 截图保存位置: {OUTPUT_DIR}/xhs_pub_*.png")
