# CSDN 保存草稿复现方案

这份文档把我刚才的操作整理成一份可复现的流程，方便“小龙虾”直接照着跑：

1. 先打开 CSDN 创作中心编辑页。
2. 再注入你自己的登录 cookie。
3. 写入标题和正文。
4. 最后只点击“保存草稿”，不主动发布。

说明：不要把真实 cookie 值写进代码仓库，下面的示例默认从本地文件读取 cookie JSON。

## 1. 依赖

Playwright：

```bash
npm i -D playwright
```

## 2. 目录约定

建议把这两个文件放在同一个目录下：

- `1.txt`：你从浏览器导出的 CSDN cookie JSON
- `publish_csdn_draft.js`：自动打开编辑页并保存草稿的脚本

## 3. 全流程代码

下面是完整脚本。它会：

1. 读取 `1.txt` 中的 cookie 数组。
2. 打开 CSDN 创作中心。
3. 注入 cookie。
4. 重新进入编辑页，等待页面变成已登录状态。
5. 写标题。
6. 写正文到 CKEditor。
7. 点击“保存草稿”。

```javascript
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EDITOR_URL = 'https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1';

function loadCookies(cookieFilePath) {
  const raw = fs.readFileSync(cookieFilePath, 'utf8');
  const cookies = JSON.parse(raw);

  return cookies.map((cookie) => {
    const mapped = {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path || '/',
    };

    if (typeof cookie.expires === 'number') {
      mapped.expires = cookie.expires;
    } else if (typeof cookie.expirationDate === 'number') {
      mapped.expires = cookie.expirationDate;
    }

    if (typeof cookie.httpOnly === 'boolean') {
      mapped.httpOnly = cookie.httpOnly;
    }

    if (typeof cookie.secure === 'boolean') {
      mapped.secure = cookie.secure;
    }

    if (cookie.sameSite === 'no_restriction') {
      mapped.sameSite = 'None';
    } else if (cookie.sameSite === 'lax') {
      mapped.sameSite = 'Lax';
    } else if (cookie.sameSite === 'strict') {
      mapped.sameSite = 'Strict';
    }

    return mapped;
  });
}

async function launchBrowser() {
  try {
    return await chromium.launch({ executablePath: EDGE_PATH, headless: false });
  } catch (err1) {
    try {
      return await chromium.launch({ channel: 'msedge', headless: false });
    } catch (err2) {
      return await chromium.launch({ headless: false });
    }
  }
}

async function waitForLoggedInEditor(page, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const titleVisible = await page.locator('#txtTitle').isVisible().catch(() => false);
    const editorReady = await page.evaluate(() => {
      const editor = window.CKEDITOR?.instances?.editor;
      return Boolean(editor);
    }).catch(() => false);

    if (titleVisible || editorReady) {
      return;
    }

    await page.waitForTimeout(1500);
  }

  throw new Error('CSDN editor did not become ready in time');
}

async function writeTitle(page, title) {
  await page.evaluate((value) => {
    const titleEl = document.getElementById('txtTitle');
    if (!titleEl) {
      throw new Error('Title input #txtTitle not found');
    }

    titleEl.value = value;
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
    titleEl.dispatchEvent(new Event('change', { bubbles: true }));
  }, title);
}

async function writeBodyToCkEditor(page, html) {
  await page.evaluate((content) => {
    const editor = window.CKEDITOR?.instances?.editor;
    if (!editor) {
      throw new Error('CKEditor instance editor not found');
    }

    editor.setData(content);
    editor.updateElement();
  }, html);
}

async function clickSaveDraft(page) {
  const button = page.getByText('保存草稿', { exact: true }).first();
  await button.click({ timeout: 10000 });
}

(async () => {
  const cookieFilePath = path.resolve(process.cwd(), '1.txt');
  const browser = await launchBrowser();
  const context = await browser.newContext({ locale: 'zh-CN' });
  const page = await context.newPage();

  try {
    const cookies = loadCookies(cookieFilePath);
    await context.addCookies(cookies);

    await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded' });
    await waitForLoggedInEditor(page);

    const title = 'Java 泛型：从入门到常见误区';
    const body = `
<h2>一、题目描述</h2>
<p>本文整理 Java 作业中的反射、代理和动态代理实现思路。</p>
<h2>二、基本实现思路</h2>
<ul>
  <li>先通过 cookie 恢复登录态。</li>
  <li>再进入 CSDN 创作中心编辑页。</li>
  <li>最后写入标题和正文，并保存为草稿。</li>
</ul>
<h2>三、核心结论</h2>
<p>稳定路线是先保存草稿，避免风控、发文上限或微信校验导致内容丢失。</p>
`;

    await writeTitle(page, title);
    await writeBodyToCkEditor(page, body);

    await page.waitForTimeout(1500);
    await clickSaveDraft(page);

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'csdn_save_draft.png', fullPage: true });
  } catch (err) {
    await page.screenshot({ path: 'csdn_save_draft_error.png', fullPage: true }).catch(() => {});
    throw err;
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
})();
```

## 4. 运行方式

```bash
node publish_csdn_draft.js
```

## 5. 这次操作对应的关键点

我刚才实际遵循的顺序就是下面这套：

1. 打开 `https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1`
2. 检查是否已经进入已登录的编辑页
3. 如果没登录，就先用 cookie 恢复登录态
4. 写标题 `#txtTitle`
5. 通过 `window.CKEDITOR.instances.editor.setData(...)` 写正文
6. 点击“保存草稿”

## 6. 给“小龙虾”的复现提示词

可以直接把下面这段发给“小龙虾”：

> 请按以下要求生成一个 Playwright 脚本：
> 1. 读取本地 `1.txt` 里的 CSDN cookie JSON。
> 2. 打开 `https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1`。
> 3. 注入 cookie 后重新进入编辑页。
> 4. 定位标题输入框 `#txtTitle`。
> 5. 通过 `window.CKEDITOR.instances.editor.setData(html)` 写正文。
> 6. 只点击“保存草稿”，不要点击“发布博客”。
> 7. 加上截图和错误处理，便于排查。

## 7. 备注

如果页面仍然停留在登录浮层，说明 cookie 已过期或者当前会话没有恢复成功。此时先重新登录，再跑脚本。