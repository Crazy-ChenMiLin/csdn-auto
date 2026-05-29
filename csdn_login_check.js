const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const COOKIE_FILE = path.resolve(process.cwd(), '1.txt');
const CHECK_URL = 'https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1';

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

    if (typeof cookie.sameSite === 'string' && cookie.sameSite !== 'null') {
      // 转换 sameSite 值
      const sameSiteMap = {
        'no_restriction': 'None',
        'unspecified': 'Lax',
        'strict': 'Strict',
        'lax': 'Lax',
        'none': 'None'
      };
      const normalized = cookie.sameSite.toLowerCase();
      mapped.sameSite = sameSiteMap[normalized] || 'Lax';
    }

    return mapped;
  });
}

async function checkLogin() {
  console.log('🚀 启动浏览器...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // 加载 Cookie
    const cookies = loadCookies(COOKIE_FILE);
    await context.addCookies(cookies);
    console.log(`✅ 已加载 ${cookies.length} 个 Cookie`);

    const page = await context.newPage();
    
    console.log('🌐 访问 CSDN 创作中心...');
    await page.goto(CHECK_URL, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // 等待页面加载
    await page.waitForTimeout(5000);

    // 检查是否登录成功
    const currentUrl = page.url();
    console.log('📍 当前 URL:', currentUrl);

    // 截图
    const screenshotPath = `csdn_login_check_${Date.now()}.png`;
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    console.log('📸 截图已保存:', screenshotPath);

    // 检查登录状态
    const isLoggedIn = !currentUrl.includes('/login') && !currentUrl.includes('unlogin');
    
    if (isLoggedIn) {
      console.log('✅ 登录状态：已登录');
      
      // 尝试获取用户名
      try {
        const userName = await page.$eval('.user-name, .username, [class*="user"] .name, .profile .name', el => el.textContent.trim());
        console.log('👤 用户名:', userName);
      } catch (e) {
        console.log('ℹ️ 无法获取用户名');
      }
    } else {
      console.log('❌ 登录状态：未登录或 Cookie 已失效');
    }

    return { isLoggedIn, screenshotPath, currentUrl };

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    throw error;
  } finally {
    await browser.close();
    console.log('🔒 浏览器已关闭');
  }
}

checkLogin().then(result => {
  console.log('\n📊 检查结果:', result);
  process.exit(result.isLoggedIn ? 0 : 1);
}).catch(error => {
  console.error('💥 执行出错:', error);
  process.exit(1);
});
