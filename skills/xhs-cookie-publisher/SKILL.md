---
name: xhs-cookie-publisher
description: Publish Xiaohongshu/RedNote creator-platform image notes and long articles using exported cookie JSON and Playwright with Microsoft Edge. Use when the user wants to test Xiaohongshu cookie login, automate image-note publishing, automate 写长文/article publishing, reproduce a cookie-only workflow, create scripts for another AI to reuse, or debug creator.xiaohongshu.com publish-page automation.
---

# XHS Cookie Publisher

## Overview

Automate Xiaohongshu creator-platform publishing with exported cookies. Prefer bundled Python scripts for reliability; they use a fresh Edge profile, inject cookies twice, publish image notes or long articles, then verify the result in "笔记管理".

Do not ask the user to paste cookie values in chat. Use a local `cookie.txt` path.

## Required Inputs

Ask for or infer these inputs:

- `cookie.txt`: browser-exported Xiaohongshu cookie JSON array.
- For image notes: image file `.jpg`, `.jpeg`, `.png`, or `.webp`.
- Title.
- Body/caption text.

Default workspace convention from the validated run:

```text
C:\Users\26487\Desktop\xiaohongshubot\cookie.txt
```

## Image Note Script

Use `scripts/publish_xhs_with_cookie.py`.

Example:

```powershell
python C:\Users\26487\.codex\skills\xhs-cookie-publisher\scripts\publish_xhs_with_cookie.py `
 --cookie C:\Users\26487\Desktop\xiaohongshubot\cookie.txt `
 --image C:\Users\26487\Desktop\Z30\DSC_1831.JPG `
 --title "把温柔装进今天" `
 --body "有些瞬间不需要太多语言，安安静静地留在相册里，就已经很美好。`n`n愿今天的风、光和心情，都刚刚好。`n`n#温馨日常 #生活碎片 #摄影记录"
```

Script behavior:

1. Read and normalize exported cookies.
2. Reset a temporary Edge profile unless `--keep-profile` is passed.
3. Launch Microsoft Edge.
4. Inject cookies with `context.add_cookies()`.
5. Open `https://www.xiaohongshu.com/`.
6. Inject cookies again with CDP `Network.setCookie`.
7. Open the image-note publish URL.
8. Fail with screenshot if redirected to login.
9. Upload image.
10. Fill title and body.
11. Screenshot before publish.
12. Click "发布".
13. Screenshot after publish.
14. Open "笔记管理" and verify the title appears.

## Long Article Script

Use `scripts/publish_xhs_article_with_cookie.py` for `写长文` / `target=article`.

Example:

```powershell
python C:\Users\26487\.codex\skills\xhs-cookie-publisher\scripts\publish_xhs_article_with_cookie.py `
 --cookie C:\Users\26487\Desktop\xiaohongshubot\cookie.txt `
 --title "把日子过得温柔一点" `
 --body "有时候，生活里的温柔并不是什么很盛大的事情。`n`n可能是一束刚好落在窗边的光，可能是一顿热乎乎的饭。`n`n#温馨日常 #生活记录"
```

Validated long-article flow:

1. Read and normalize cookies.
2. Reset temporary Edge profile.
3. Inject cookies with `context.add_cookies()` and CDP `Network.setCookie`.
4. Open `target=article`.
5. Click "新的创作".
6. Fill `textarea[placeholder="输入标题"]`.
7. Fill first `[contenteditable="true"]`.
8. Click red "一键排版".
9. Click red "下一步".
10. On the final settings/preview page, click red "发布".
11. Open "笔记管理" and verify the title appears.

## Validation Workflow

When the user asks to test cookie-only login before publishing, run:

```powershell
python C:\Users\26487\.codex\skills\xhs-cookie-publisher\scripts\test_xhs_cookie_login.py `
 --cookie C:\Users\26487\Desktop\xiaohongshubot\cookie.txt `
 --output-dir C:\Users\26487\Desktop\xiaohongshubot
```

Expected success signals:

```text
HOME_HAS_LOGIN_MODAL=False
PUBLISH_IS_LOGIN_PAGE=False
PUBLISH_HAS_UPLOAD_IMAGE=True
PUBLISH_HAS_PUBLISH_NOTE=True
```

If the publish page shows "短信登录" or URL contains `/login`, the cookie is invalid or incomplete.

## Cookie Handling Rules

Normalize browser-exported cookies before injection:

- `expirationDate` -> `expires`
- `sameSite: "no_restriction"` -> `"None"`
- `sameSite: "lax"` -> `"Lax"`
- `sameSite: "strict"` -> `"Strict"`
- omit `sameSite` when it is `null`
- keep `httpOnly` and `secure` booleans when present

Important cookie names usually include:

```text
web_session
id_token
a1
gid
webId
websectiga
xsecappid
access-token-creator.xiaohongshu.com
customer-sso-sid
customerClientId
galaxy_creator_session_id
galaxy.creator.beaker.session.id
```

If homepage login works but creator platform fails, re-export cookies after visiting and logging into `https://creator.xiaohongshu.com/`.

## Page Selectors

Use these validated selectors:

```python
# image note
page.locator("input[type=file]").first.set_input_files(str(image_file))
page.locator('input[placeholder="填写标题会有更多赞哦"]').fill(title)
page.locator('[contenteditable="true"]').first.fill(body)
page.get_by_text("发布", exact=True).last.click(timeout=10000)
page.get_by_text("笔记管理", exact=True).click(timeout=5000)

# long article
page.get_by_text("新的创作", exact=True).click(timeout=10000)
page.locator('textarea[placeholder="输入标题"]').first.fill(title)
page.locator('[contenteditable="true"]').first.fill(body)
page.get_by_text("一键排版", exact=True).last.click(timeout=10000)
page.get_by_text("下一步", exact=True).last.click(timeout=10000)
page.get_by_text("发布", exact=True).last.click(timeout=10000)
```

Publish URL:

```text
https://creator.xiaohongshu.com/publish/publish?source=official&from=tab_switch&target=image
```

Long article publish URL:

```text
https://creator.xiaohongshu.com/publish/publish?source=official&from=menu&target=article
```

Note manager entry:

```text
https://creator.xiaohongshu.com/new/home?source=official
```

## Troubleshooting

- **Redirected to login**: cookie expired, incomplete, or missing creator-platform cookies. Re-export after opening creator platform.
- **Upload succeeds but title input missing**: wait longer, verify image format/size, screenshot page.
- **After publish returns to upload page**: check URL for `published=true`, then verify in "笔记管理"; do not rely only on the upload page.
- **Long article shows no 发布 button in editor**: click "一键排版" first, then "下一步"; only the final settings page has the red "发布" button.
- **Page text includes "遇到问题"**: still verify in "笔记管理"; validated runs showed this text while publish still succeeded.
- **PowerShell cannot print emojis/non-GBK text**: set `$env:PYTHONIOENCODING='utf-8'`.

## References

Read `references/reproduction.md` when the user wants a detailed handoff document for another AI or a full explanation of the validated workflow.
