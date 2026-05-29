const { chromium } = require('playwright');
const fs = require('fs');
const { marked } = require('marked');

// 配置
const COOKIE_FILE = '/home/node/.openclaw/workspace/1.txt';
const REPORT_FILE = '/home/node/.openclaw/workspace/reports/chenmilin_xyz_502_error_report_2026-05-20.md';

// 加载 Cookie
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

// Markdown 转 HTML（CSDN 适配）
function markdownToCSDNHtml(mdContent) {
  // 使用 marked 转换
  let html = marked(mdContent);
  
  // CSDN 特殊处理：代码块添加语言标识
  html = html.replace(/<pre><code>/g, '<pre><code class="language-bash">');
  
  return html;
}

async function publishToCSDN() {
  console.log('🚀 开始发布到 CSDN...');
  
  // 读取报告内容
  const mdContent = fs.readFileSync(REPORT_FILE, 'utf8');
  const htmlContent = markdownToCSDNHtml(mdContent);
  
  // 提取标题（第一行的 # 标题）
  const titleMatch = mdContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'chenmilin.xyz 网站 502 错误诊断报告';
  
  console.log('📝 标题:', title);
  console.log('📄 内容长度:', htmlContent.length, '字符');
  
  // 加载 Cookie
  const cookies = loadCookies(COOKIE_FILE);
  console.log('🍪 Cookie 数量:', cookies.length);
  
  // 启动浏览器
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  await context.addCookies(cookies);
  
  const page = await context.newPage();
  
  try {
    // 访问编辑器
    console.log('🌐 访问 CSDN 编辑器...');
    await page.goto('https://mp.csdn.net/mp_blog/creation/editor', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 检测登录状态
    await page.waitForTimeout(2000);
    const titleVisible = await page.locator('#txtTitle').isVisible();
    const editorReady = await page.evaluate(() => {
      return Boolean(window.CKEDITOR?.instances?.editor);
    });
    
    if (!titleVisible || !editorReady) {
      throw new Error('未检测到登录状态，Cookie 可能已失效');
    }
    
    console.log('✅ 登录状态正常');
    
    // 写入标题
    console.log('📝 写入标题...');
    await page.evaluate((value) => {
      const titleEl = document.getElementById('txtTitle');
      titleEl.value = value;
      titleEl.dispatchEvent(new Event('input', { bubbles: true }));
      titleEl.dispatchEvent(new Event('change', { bubbles: true }));
    }, title);
    
    await page.waitForTimeout(1000);
    
    // 写入正文
    console.log('📄 写入正文...');
    await page.evaluate((content) => {
      const editor = window.CKEDITOR.instances.editor;
      editor.setData(content);
      editor.updateElement();
    }, htmlContent);
    
    await page.waitForTimeout(2000);
    
    // 保存草稿
    console.log('💾 保存草稿...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveButton = buttons.find(el => 
        (el.innerText || '').trim() === '保存草稿'
      );
      saveButton?.click();
    });
    
    await page.waitForTimeout(3000);
    
    // 检查保存结果
    const success = await page.evaluate(() => {
      // 检查是否有成功提示
      const toast = document.querySelector('.toast-success, .el-message--success');
      return Boolean(toast);
    });
    
    if (success) {
      console.log('✅ 草稿保存成功！');
    } else {
      console.log('⚠️  未检测到成功提示，但草稿可能已保存');
    }
    
    // 截图确认
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-publish-result-2026-05-20.png',
      fullPage: false
    });
    console.log('📸 截图已保存');
    
  } catch (error) {
    console.error('❌ 发布失败:', error.message);
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-publish-error-2026-05-20.png'
    });
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('🎉 发布流程完成！');
}

// 执行发布
publishToCSDN().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});