import argparse
import json
import shutil
from pathlib import Path

from playwright.sync_api import sync_playwright


DEFAULT_EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
ARTICLE_URL = "https://creator.xiaohongshu.com/publish/publish?source=official&from=menu&target=article"
NOTE_MANAGER_URL = "https://creator.xiaohongshu.com/new/home?source=official"


def normalize_cookie(raw_cookie: dict) -> dict:
    cookie = {
        "name": raw_cookie["name"],
        "value": raw_cookie["value"],
        "domain": raw_cookie["domain"],
        "path": raw_cookie.get("path") or "/",
    }

    expires = raw_cookie.get("expires", raw_cookie.get("expirationDate"))
    if isinstance(expires, (int, float)):
        cookie["expires"] = int(expires)

    if isinstance(raw_cookie.get("httpOnly"), bool):
        cookie["httpOnly"] = raw_cookie["httpOnly"]
    if isinstance(raw_cookie.get("secure"), bool):
        cookie["secure"] = raw_cookie["secure"]

    same_site = raw_cookie.get("sameSite")
    if isinstance(same_site, str):
        normalized = same_site.lower()
        if normalized in ("no_restriction", "none"):
            cookie["sameSite"] = "None"
        elif normalized == "lax":
            cookie["sameSite"] = "Lax"
        elif normalized == "strict":
            cookie["sameSite"] = "Strict"

    return cookie


def load_cookies(cookie_file: Path) -> list[dict]:
    raw_cookies = json.loads(cookie_file.read_text(encoding="utf-8"))
    return [normalize_cookie(cookie) for cookie in raw_cookies]


def inject_cookies_with_cdp(page, cookies: list[dict]) -> tuple[int, list[str]]:
    client = page.context.new_cdp_session(page)
    client.send("Network.enable")

    ok_count = 0
    failed = []
    for cookie in cookies:
        try:
            result = client.send("Network.setCookie", cookie)
            if result.get("success"):
                ok_count += 1
            else:
                failed.append(cookie["name"])
        except Exception as exc:
            failed.append(f"{cookie['name']}: {exc}")

    return ok_count, failed


def assert_creator_login(page) -> None:
    text = page.locator("body").inner_text(timeout=5000)
    if "/login" in page.url or "短信登录" in text:
        raise RuntimeError("Cookie did not restore creator login state.")
    if "写长文" not in text and "新的创作" not in text and "输入标题" not in text:
        raise RuntimeError("Article creator page loaded, but expected article controls were not found.")


def publish_article(args: argparse.Namespace) -> None:
    cookie_file = Path(args.cookie)
    output_dir = Path(args.output_dir)
    profile_dir = Path(args.profile)

    if not cookie_file.exists():
        raise FileNotFoundError(f"Cookie file not found: {cookie_file}")

    output_dir.mkdir(parents=True, exist_ok=True)
    if args.reset_profile and profile_dir.exists():
        shutil.rmtree(profile_dir)
    profile_dir.mkdir(parents=True, exist_ok=True)

    cookies = load_cookies(cookie_file)

    with sync_playwright() as p:
        # Use regular launch instead of persistent context for Linux compatibility
        browser = p.chromium.launch(
            headless=args.headless,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        context = browser.new_context(
            locale="zh-CN",
            viewport={"width": 1440, "height": 1000},
        )
        page = context.new_page()

        try:
            context.add_cookies(cookies)
            page.goto("https://www.xiaohongshu.com/", wait_until="domcontentloaded")
            ok_count, failed = inject_cookies_with_cdp(page, cookies)
            print(f"CDP cookie injected: {ok_count}/{len(cookies)}")
            if failed:
                print(f"Failed cookies: {failed}")

            page.goto(ARTICLE_URL, wait_until="domcontentloaded")
            page.wait_for_timeout(args.initial_wait_ms)
            assert_creator_login(page)

            text = page.locator("body").inner_text(timeout=5000)
            if "新的创作" in text:
                page.get_by_text("新的创作", exact=True).click(timeout=10000)
                page.wait_for_timeout(args.editor_wait_ms)

            title_input = page.locator('textarea[placeholder="输入标题"]').first
            title_input.wait_for(state="visible", timeout=30000)
            title_input.fill(args.title)

            editor = page.locator('[contenteditable="true"]').first
            editor.wait_for(state="visible", timeout=30000)
            editor.click()
            editor.fill(args.body)
            page.wait_for_timeout(2000)

            page.screenshot(path=str(output_dir / "xhs_article_editor_filled.png"), full_page=True)

            # Article flow step 1: the red button is "一键排版", which generates preview pages.
            page.get_by_text("一键排版", exact=True).last.click(timeout=10000)
            page.wait_for_timeout(args.layout_wait_ms)
            page.screenshot(path=str(output_dir / "xhs_article_after_layout.png"), full_page=True)

            # Article flow step 2: enter the final publish/settings page.
            page.get_by_text("下一步", exact=True).last.click(timeout=10000)
            page.wait_for_timeout(args.final_page_wait_ms)
            page.screenshot(path=str(output_dir / "xhs_article_final_publish_page.png"), full_page=True)

            final_text = page.locator("body").inner_text(timeout=5000)
            if "发布" not in final_text:
                raise RuntimeError("Final article publish page did not expose the 发布 button.")

            page.get_by_text("发布", exact=True).last.click(timeout=10000)
            page.wait_for_timeout(args.after_publish_wait_ms)
            page.screenshot(path=str(output_dir / "xhs_article_after_publish.png"), full_page=True)
            print(f"After publish url: {page.url}")

            # Use direct URL to note manager instead of clicking menu
            NOTE_MANAGER_DIRECT_URL = "https://creator.xiaohongshu.com/new/note-manager?source=official"
            print(f"Navigating to note manager directly: {NOTE_MANAGER_DIRECT_URL}")
            page.goto(NOTE_MANAGER_DIRECT_URL, wait_until="domcontentloaded")
            page.wait_for_timeout(6000)

            manager_text = page.locator("body").inner_text(timeout=10000)
            found = args.title in manager_text
            page.screenshot(path=str(output_dir / "xhs_article_note_manager.png"), full_page=True)
            print(f"Title found in note manager: {found}")
            if not found:
                print(f"⚠️ Warning: Title '{args.title}' not found in note manager, but publish may still succeed.")
                print(f"   Check screenshot: xhs_article_note_manager.png")
        except Exception:
            try:
                page.screenshot(path=str(output_dir / "xhs_article_error.png"), full_page=True)
            except Exception:
                pass
            raise
        finally:
            browser.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Publish a Xiaohongshu long article using exported cookies.")
    parser.add_argument("--cookie", required=True, help="Cookie JSON file path.")
    parser.add_argument("--title", required=True, help="Article title.")
    parser.add_argument("--body", required=True, help="Article body.")
    parser.add_argument("--output-dir", default=".", help="Directory for screenshots.")
    parser.add_argument("--profile", default="./xhs_cookie_article_profile", help="Temporary Edge profile directory.")
    parser.add_argument("--reset-profile", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--edge", default=DEFAULT_EDGE_PATH, help="Microsoft Edge executable path.")
    parser.add_argument("--headless", action="store_true", help="Run headless. Headed is recommended for debugging.")
    parser.add_argument("--initial-wait-ms", type=int, default=6000)
    parser.add_argument("--editor-wait-ms", type=int, default=7000)
    parser.add_argument("--layout-wait-ms", type=int, default=12000)
    parser.add_argument("--final-page-wait-ms", type=int, default=12000)
    parser.add_argument("--after-publish-wait-ms", type=int, default=15000)
    args = parser.parse_args()

    publish_article(args)


if __name__ == "__main__":
    main()
