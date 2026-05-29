const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const COOKIE_FILE = path.resolve(process.cwd(), '1.txt');
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

async function waitForLoggedInEditor(page, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const titleVisible = await page.locator('#txtTitle').isVisible().catch(() => false);
    const userAvatar = await page.locator('.user-avatar, .avatar, [class*="avatar"]').first().isVisible().catch(() => false);
    const editorReady = await page.evaluate(() => {
      const editor = window.CKEDITOR?.instances?.editor;
      return Boolean(editor);
    }).catch(() => false);

    console.log(`Check: titleVisible=${titleVisible}, userAvatar=${userAvatar}, editorReady=${editorReady}`);

    if (titleVisible || editorReady) {
      return { titleVisible, userAvatar, editorReady };
    }

    await page.waitForTimeout(1500);
  }

  throw new Error('CSDN editor did not become ready in time');
}

(async () => {
  console.log('Starting CSDN login test...');
  console.log('Loading cookies from:', COOKIE_FILE);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'zh-CN' });
  const page = await context.newPage();

  try {
    const cookies = loadCookies(COOKIE_FILE);
    console.log(`Loaded ${cookies.length} cookies`);

    await context.addCookies(cookies);
    console.log('Cookies injected');

    console.log('Navigating to:', EDITOR_URL);
    await page.goto(EDITOR_URL, { waitUntil: 'networkidle' });

    console.log('Waiting for login status...');
    const status = await waitForLoggedInEditor(page);
    console.log('Login status:', status);

    await page.waitForTimeout(3000);

    const screenshotPath = 'csdn_login_success.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved:', screenshotPath);

    const pageTitle = await page.title();
    const currentUrl = page.url();
    console.log('Page title:', pageTitle);
    console.log('Current URL:', currentUrl);

    const userInfo = await page.evaluate(() => {
      const nickEl = document.querySelector('[class*="nick"], [class*="user-name"]');
      return nickEl ? nickEl.textContent : null;
    }).catch(() => null);

    if (userInfo) {
      console.log('Detected user:', userInfo);
    }

  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: 'csdn_login_error.png', fullPage: true });
    console.log('Error screenshot saved: csdn_login_error.png');
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
})();
