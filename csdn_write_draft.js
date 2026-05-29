const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const COOKIE_FILE = path.resolve(process.cwd(), '1.txt');
const EDITOR_URL = 'https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1';

// 文章内容
const blogTitle = "AI助手自动化测试文章 - " + new Date().toLocaleString('zh-CN');
const blogContent = `
<h2>一、测试目的</h2>
<p>本文是 AI 助手自动化测试 CSDN 发布功能的文章，用于验证自动化流程是否正常。</p>

<h2>二、技术方案</h2>
<ul>
  <li>使用 Playwright 浏览器自动化工具</li>
  <li>通过 Cookie 注入实现免登录</li>
  <li>操作 CKEditor 富文本编辑器写入内容</li>
  <li>自动点击"保存草稿"按钮</li>
</ul>

<h2>三、测试内容</h2>
<p>这篇文章由 OpenClaw AI 助手自动生成，测试 CSDN 博客平台的草稿保存功能。</p>
<p>测试时间：${new Date().toLocaleString('zh-CN')}</p>

<h2>四、结论</h2>
<p>如果看到这篇文章，说明自动化流程运行成功！🎉</p>
`;

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

async function waitForLoggedInEditor(page, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const titleVisible = await page.locator('#txtTitle').isVisible().catch(() => false);
    const editorReady = await page.evaluate(() => {
      const editor = window.CKEDITOR?.instances?.editor;
      return Boolean(editor);
    }).catch(() => false);

    if (titleVisible && editorReady) {
      return { titleVisible, editorReady };
    }
    await page.waitForTimeout(1500);
  }
  throw new Error('CSDN editor did not become ready in time');
}

async function writeTitle(page, title) {
  await page.evaluate((value) => {
    const titleEl = document.getElementById('txtTitle');
    if (!titleEl) throw new Error('Title input #txtTitle not found');
    titleEl.value = value;
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
    titleEl.dispatchEvent(new Event('change', { bubbles: true }));
  }, title);
}

async function writeBodyToCkEditor(page, html) {
  await page.evaluate((content) => {
    const editor = window.CKEDITOR?.instances?.editor;
    if (!editor) throw new Error('CKEditor instance editor not found');
    editor.setData(content);
    editor.updateElement();
  }, html);
}

async function clickSaveDraft(page) {
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveButton = buttons.find(el => 
      (el.innerText || '').trim() === '保存草稿' ||
      (el.textContent || '').trim() === '保存草稿'
    );
    if (!saveButton) throw new Error('Save draft button not found');
    saveButton.click();
  });
}

(async () => {
  console.log('========================================');
  console.log('CSDN 草稿保存测试');
  console.log('========================================');
  console.log('标题:', blogTitle);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'zh-CN' });
  const page = await context.newPage();

  try {
    // 加载并注入 Cookie
    const cookies = loadCookies(COOKIE_FILE);
    console.log(`✅ 加载了 ${cookies.length} 个 cookies`);
    await context.addCookies(cookies);
    console.log('✅ Cookie 注入完成');

    // 访问编辑器
    console.log('🌐 正在打开编辑器...');
    await page.goto(EDITOR_URL, { waitUntil: 'networkidle' });

    // 等待登录和编辑器就绪
    console.log('⏳ 等待编辑器就绪...');
    const status = await waitForLoggedInEditor(page);
    console.log('✅ 编辑器就绪:', status);

    // 写入标题
    console.log('📝 写入标题...');
    await writeTitle(page, blogTitle);
    console.log('✅ 标题写入完成');

    // 写入正文
    console.log('📝 写入正文...');
    await writeBodyToCkEditor(page, blogContent);
    console.log('✅ 正文写入完成');

    await page.waitForTimeout(2000);

    // 填写前的截图
    await page.screenshot({ path: 'csdn_before_save.png', fullPage: true });
    console.log('📸 已保存截图: csdn_before_save.png');

    // 点击保存草稿
    console.log('💾 正在保存草稿...');
    await clickSaveDraft(page);
    console.log('✅ 已点击保存草稿按钮');

    // 等待保存完成
    await page.waitForTimeout(5000);

    // 保存后的截图
    await page.screenshot({ path: 'csdn_after_save.png', fullPage: true });
    console.log('📸 已保存截图: csdn_after_save.png');

    console.log('');
    console.log('========================================');
    console.log('🎉 草稿保存完成！');
    console.log('========================================');

  } catch (err) {
    console.error('❌ 错误:', err.message);
    await page.screenshot({ path: 'csdn_error.png', fullPage: true });
    console.log('📸 错误截图已保存: csdn_error.png');
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
})();
