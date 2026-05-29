/**
 * CSDN Cookie 测试脚本
 * 测试 Cookie 是否有效
 */

const fs = require('fs');
const { chromium } = require('playwright');

const COOKIE_FILE = '/home/node/.openclaw/workspace/1.txt';

async function testCSDN() {
  console.log('🔍 CSDN Cookie 测试\n');
  console.log('Cookie 文件:', COOKIE_FILE);
  
  // 读取 Cookie
  if (!fs.existsSync(COOKIE_FILE)) {
    console.error('❌ Cookie 文件不存在');
    return;
  }
  
  const raw = fs.readFileSync(COOKIE_FILE, 'utf8');
  const cookies = JSON.parse(raw);
  console.log(`✅ 读取到 ${cookies.length} 个 Cookie\n`);
  
  // 检查关键 Cookie
  const keyCookies = ['UserName', 'UserToken', 'UserInfo', 'SESSION'];
  console.log('关键 Cookie 检查:');
  for (const key of keyCookies) {
    const found = cookies.find(c => c.name === key);
    if (found) {
      const expDate = found.expirationDate ? new Date(found.expirationDate * 1000) : null;
      const isExpired = expDate && expDate < new Date();
      console.log(`  ${key}: ${found.value.substring(0, 20)}... ${isExpired ? '❌ 已过期' : '✅ 有效'} ${expDate ? `(过期: ${expDate.toLocaleString('zh-CN')})` : '(会话 Cookie)'}`);
    } else {
      console.log(`  ${key}: ❌ 未找到`);
    }
  }
  
  // 转换 Cookie 格式
  const mappedCookies = cookies.map(cookie => {
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
  
  console.log('\n🌐 启动浏览器测试...\n');
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox']
    });
    
    const context = await browser.newContext({
      locale: 'zh-CN',
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    // 注入 Cookie
    await context.addCookies(mappedCookies);
    console.log('✅ Cookie 注入完成\n');
    
    // 访问编辑器
    console.log('访问 CSDN 编辑器...');
    const resp = await page.goto('https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    console.log(`HTTP 状态: ${resp?.status() || 'error'}`);
    console.log(`页面 URL: ${page.url()}`);
    console.log(`页面标题: ${await page.title()}\n`);
    
    // 等待页面加载
    await page.waitForTimeout(5000);
    
    // 检查登录状态
    const titleVisible = await page.locator('#txtTitle').isVisible().catch(() => false);
    const editorReady = await page.evaluate(() => {
      return Boolean(window.CKEDITOR?.instances?.editor);
    }).catch(() => false);
    
    console.log('登录状态检查:');
    console.log(`  标题输入框: ${titleVisible ? '✅ 可见' : '❌ 不可见'}`);
    console.log(`  CKEditor: ${editorReady ? '✅ 已加载' : '❌ 未加载'}\n`);
    
    // 截图
    const screenshot = `/home/node/.openclaw/workspace/csdn_test_${Date.now()}.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log(`📸 截图已保存: ${screenshot}\n`);
    
    if (titleVisible && editorReady) {
      console.log('✅ Cookie 有效！可以正常访问 CSDN 编辑器');
    } else {
      console.log('❌ Cookie 可能已失效，无法访问编辑器');
      console.log('建议：重新登录 CSDN 并导出新的 Cookie');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testCSDN();
