const { chromium } = require('playwright');
const fs = require('fs');
const { marked } = require('marked');

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

function markdownToCSDNHtml(mdContent) {
  let html = marked(mdContent);
  html = html.replace(/<pre><code>/g, '<pre><code class="language-bash">');
  return html;
}

async function publishWithCover() {
  console.log('🚀 开始发布到 CSDN（含封面图）...');
  
  const mdContent = fs.readFileSync(REPORT_FILE, 'utf8');
  const htmlContent = markdownToCSDNHtml(mdContent);
  const titleMatch = mdContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'chenmilin.xyz 网站 502 错误诊断报告';
  
  console.log('📝 标题:', title);
  
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
    await page.goto('https://mp.csdn.net/mp_blog/creation/editor', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);
    
    // 检查登录
    const titleVisible = await page.locator('#txtTitle').isVisible();
    if (!titleVisible) {
      throw new Error('未登录');
    }
    console.log('✅ 登录成功');
    
    // 写入标题
    console.log('📝 写入标题...');
    await page.evaluate((t) => {
      const el = document.getElementById('txtTitle');
      el.value = t;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, title);
    await page.waitForTimeout(1000);
    
    // 写入内容
    console.log('📄 写入内容...');
    await page.evaluate((c) => {
      const editor = window.CKEDITOR.instances.editor;
      editor.setData(c);
      editor.updateElement();
    }, htmlContent);
    await page.waitForTimeout(2000);
    
    // 尝试添加封面图
    console.log('🎨 尝试添加封面图...');
    
    // 生成封面图 URL
    const coverPrompt = encodeURIComponent('Server error 502 diagnostic report, technology theme, clean minimalist design, blue and white colors, professional');
    const coverUrl = `https://image.pollinations.ai/prompt/${coverPrompt}?width=1200&height=630&nologo=true`;
    
    console.log('📸 封面图 URL:', coverUrl);
    
    // 查找封面图设置区域
    // CSDN 的封面图通常在"文章设置"面板中
    try {
      // 方法1：点击"文章设置"按钮
      const settingsBtn = await page.locator('text=文章设置').first();
      if (await settingsBtn.isVisible()) {
        await settingsBtn.click();
        await page.waitForTimeout(1000);
        console.log('✅ 打开文章设置');
      }
      
      // 方法2：查找封面图上传区域
      const coverSection = await page.locator('text=封面图').first();
      if (await coverSection.isVisible()) {
        console.log('✅ 找到封面图区域');
        
        // 尝试点击"上传封面"或"添加封面"
        const uploadBtn = await page.locator('button:has-text("上传"), button:has-text("添加")').first();
        if (await uploadBtn.isVisible()) {
          await uploadBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch (e) {
      console.log('⚠️  封面图设置跳过:', e.message);
    }
    
    // 截图当前状态
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-editor-state.png',
      fullPage: true 
    });
    console.log('📸 编辑器状态截图已保存');
    
    // 保存草稿
    console.log('💾 保存草稿...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(el => (el.innerText || '').trim() === '保存草稿');
      saveBtn?.click();
    });
    await page.waitForTimeout(3000);
    
    // 最终截图
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-saved.png',
      fullPage: true 
    });
    console.log('✅ 草稿已保存');
    
    // 输出封面图 URL 供手动使用
    console.log('\n📌 封面图 URL（可手动添加）:');
    console.log(coverUrl);
    console.log('\n💡 提示：登录 CSDN 后台手动添加封面图');
    console.log('   https://mp.csdn.net/mp_blog/manage/article');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ path: '/home/node/.openclaw/workspace/csdn-error.png' });
  } finally {
    await browser.close();
  }
}

publishWithCover();