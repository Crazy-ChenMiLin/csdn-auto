# Xiaohongshu Cookie Publishing Reference

Use this reference when preparing a detailed handoff for another AI or debugging image-note or long-article publishing.

## Validated Result

Cookie-only login test succeeded in a fresh temporary Edge profile.

Success signals:

```text
COOKIE_COUNT=19
CDP_COOKIE_OK=19
CDP_COOKIE_FAIL=[]
HOME_URL=https://www.xiaohongshu.com/explore
HOME_HAS_LOGIN_MODAL=False
HOME_HAS_ME=True
PUBLISH_URL=https://creator.xiaohongshu.com/publish/publish?source=official&from=tab_switch&target=image
PUBLISH_IS_LOGIN_PAGE=False
PUBLISH_HAS_UPLOAD_IMAGE=True
PUBLISH_HAS_PUBLISH_NOTE=True
```

The creator page may include the text "遇到问题" while still working. Treat "笔记管理 contains the title" as the final success check.

## Cookie Requirements

Use browser-exported JSON array cookies for `.xiaohongshu.com`. The validated cookie set contained:

```text
loadts
xsecappid
x-user-id-creator.xiaohongshu.com
websectiga
galaxy_creator_session_id
webBuild
galaxy.creator.beaker.session.id
sec_poison_id
web_session
gid
a1
abRequestId
access-token-creator.xiaohongshu.com
customer-sso-sid
customerClientId
ets
id_token
unread
webId
```

Creator-platform login often depends on:

```text
access-token-creator.xiaohongshu.com
customer-sso-sid
customerClientId
galaxy_creator_session_id
galaxy.creator.beaker.session.id
```

If missing, visit `https://creator.xiaohongshu.com/` in the source browser before exporting cookies.

## Detailed Flow

### Image note flow

1. Read cookie JSON from disk.
2. Convert cookie fields:
 - `expirationDate` to `expires`
 - `sameSite` values to Playwright form
 - omit `sameSite` when null
3. Reset a temporary Edge profile to prove cookie-only login.
4. Launch Edge with Playwright.
5. Add cookies with `context.add_cookies`.
6. Open `https://www.xiaohongshu.com/`.
7. Add cookies again with CDP `Network.setCookie`.
8. Navigate to `https://creator.xiaohongshu.com/publish/publish?source=official&from=tab_switch&target=image`.
9. Detect login failure:
 - URL contains `/login`
 - body contains `短信登录`
10. Upload image with the first `input[type=file]`.
11. Wait for upload and editor controls.
12. Fill title input with placeholder `填写标题会有更多赞哦`.
13. Fill first `[contenteditable="true"]`.
14. Screenshot before publish.
15. Click the last exact text button `发布`.
16. Wait after publish.
17. Screenshot after publish.
18. Open home, click `笔记管理`.
19. Verify title appears in page body.

### Long article flow

Validated URL:

```text
https://creator.xiaohongshu.com/publish/publish?source=official&from=menu&target=article
```

Validated steps:

1. Read cookie JSON from disk.
2. Normalize cookies and inject with both `context.add_cookies` and CDP `Network.setCookie`.
3. Open `target=article`.
4. If the page is the article landing page, click `新的创作`.
5. Fill title:

```python
page.locator('textarea[placeholder="输入标题"]').first.fill(title)
```

6. Fill body:

```python
page.locator('[contenteditable="true"]').first.fill(body)
```

7. Click the red editor button `一键排版`.
8. Wait for the generated preview pages. The page should show `1/2`, `2/2`, templates, and a red `下一步` button.
9. Click `下一步`.
10. The final settings page should show:

```text
图片编辑
内容设置
暂存离开
发布
笔记预览
封面预览
```

11. Click the red `发布` button.
12. If URL returns to `published=true`, open note manager and verify title.

Important correction:

The first article editor screen does not expose the final `发布` button. Its red button is `一键排版`. The final `发布` button appears only after `一键排版 -> 下一步`.

## Common Failure Modes

### Cookie invalid

Symptoms:

```text
PUBLISH_IS_LOGIN_PAGE=True
```

Fix:

1. Log into Xiaohongshu and creator platform manually.
2. Re-export cookies for `.xiaohongshu.com`.
3. Retry with a reset profile.

### Upload did not expose title/body fields

Fix:

- Wait longer after upload.
- Verify image type is `.jpg`, `.jpeg`, `.png`, or `.webp`.
- Check image size under the platform limit.
- Capture screenshot and inspect current page text.

### Publish page returns to upload page

If URL contains `published=true`, open note manager and verify title. The upload page alone is not enough.

### Long article has no publish button

Expected if still on the editor page. Continue:

```text
一键排版 -> 下一步 -> 发布
```

## Handoff Prompt

Use this prompt for another AI:

```text
Use the xhs-cookie-publisher workflow to publish a Xiaohongshu image note. Read cookie.txt as browser-exported JSON, normalize cookie fields, start a fresh Edge profile, inject cookies with context.add_cookies and CDP Network.setCookie, open the creator image publish page, upload the image, fill the title/body selectors, click 发布, then verify the title appears in 笔记管理. Save screenshots for before publish, after publish, and note-manager verification. If redirected to login or page contains 短信登录, report cookie failure and do not continue.
```

Long article handoff prompt:

```text
Use the xhs-cookie-publisher workflow to publish a Xiaohongshu long article. Read cookie.txt as browser-exported JSON, normalize cookie fields, start a fresh Edge profile, inject cookies with context.add_cookies and CDP Network.setCookie, open https://creator.xiaohongshu.com/publish/publish?source=official&from=menu&target=article, click 新的创作, fill textarea[placeholder="输入标题"], fill the first [contenteditable="true"], click 一键排版, wait for preview pages, click 下一步, then click the final red 发布 button. Verify the title appears in 笔记管理. Save screenshots at editor-filled, after-layout, final-publish-page, after-publish, and note-manager verification.
```
