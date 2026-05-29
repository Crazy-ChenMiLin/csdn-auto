const { chromium } = require('playwright');
const fs = require('fs');

const COOKIE_FILE = '/home/node/.openclaw/workspace/1.txt';
const REPORT_FILE = '/home/node/.openclaw/workspace/reports/chenmilin_xyz_502_error_report_2026-05-20.md';

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
    if (typeof cookie.expires === 'number') mapped.expires = cookie.expires;
    else if (typeof cookie.expirationDate === 'number') mapped.expires = cookie.expirationDate;
    if (typeof cookie.httpOnly === 'boolean') mapped.httpOnly = cookie.httpOnly;
    if (typeof cookie.secure === 'boolean') mapped.secure = cookie.secure;
    if (cookie.sameSite === 'no_restriction') mapped.sameSite = 'None';
    else if (cookie.sameSite === 'lax') mapped.sameSite = 'Lax';
    else if (cookie.sameSite === 'strict') mapped.sameSite = 'Strict';
    return mapped;
  });
}

async function addCoverAndSave() {
  console.log('🚀 启动浏览器...');
  
  const cookies = loadCookies(COOKIE_FILE);
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext();
  await context.addCookies(cookies);
  const page = await context.newPage();
  
  try {
    // 访问编辑器
    console.log('🌐 访问编辑器...');
    await page.goto('https://mp.csdn.net/mp_blog/creation/editor', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 检查登录状态
    const titleVisible = await page.locator('#txtTitle').isVisible().catch(() => false);
    if (!titleVisible) {
      throw new Error('未登录，Cookie 可能已失效');
    }
    console.log('✅ 登录成功');
    
    // 读取报告
    const mdContent = fs.readFileSync(REPORT_FILE, 'utf8');
    const titleMatch = mdContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'chenmilin.xyz 网站 502 错误诊断报告';
    
    // 写入标题
    console.log('📝 写入标题...');
    await page.evaluate((t) => {
      const el = document.getElementById('txtTitle');
      el.value = t;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, title);
    await page.waitForTimeout(1000);
    
    // 写入内容（简化版）
    console.log('📄 写入内容...');
    const simpleContent = `<h1>${title}</h1><p>这是一篇关于网站 502 错误的诊断报告。</p><p>详细内容请查看完整报告。</p>`;
    await page.evaluate((c) => {
      const editor = window.CKEDITOR.instances.editor;
      editor.setData(c);
      editor.updateElement();
    }, simpleContent);
    await page.waitForTimeout(2000);
    
    // 生成封面图
    console.log('🎨 生成封面图...');
    const coverUrl = `https://image.pollinations.ai/prompt/Server%20error%20502%20diagnostic%20report%2C%20technology%20theme%2C%20clean%20minimalist%20design%2C%20blue%20and%20white%20colors?width=1200&height=630`;
    
    // 查找封面图上传区域
    console.log('📤 上传封面图...');
    
    // 方法1：尝试找到封面图设置按钮
    const coverButton = await page.locator('text=封面图').first();
    if (await coverButton.isVisible()) {
      await coverButton.click();
      await page.waitForTimeout(1000);
      
      // 尝试找到输入框并填入 URL
      const urlInput = await page.locator('input[placeholder*="图片"]').first();
      if (await urlInput.isVisible()) {
        await urlInput.fill(coverUrl);
        await page.waitForTimeout(2000);
      }
    }
    
    // 截图当前状态
    await page.screenshot({ path: '/home/node/.openclaw/workspace/csdn-with-cover.png', fullPage: true });
    console.log('📸 截图已保存');
    
    // 保存草稿
    console.log('💾 保存草稿...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(el => (el.innerText || '').trim() === '保存草稿');
      saveBtn?.click();
    });
    await page.waitForTimeout(3000);
    
    // 最终截图
    await page.screenshot({ path: '/home/node/.openclaw/workspace/csdn-final.png' });
    console.log('✅ 完成！');
    
    // 保持浏览器打开 30 秒让你查看
    console.log('⏳ 浏览器将保持打开 30 秒...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: '/home/node/.openclaw/workspace/csdn-error.png' });
  } finally {
    await browser.close();
  }
}

addCoverAndSave();