const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  // 读取cookies
  const cookiesData = JSON.parse(fs.readFileSync('/home/node/.openclaw/workspace/douyin_cookies.json', 'utf8'));
  const cookies = cookiesData.cookies;
  
  // 启动浏览器
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // 添加cookies
  await context.addCookies(cookies);
  
  // 打开新页面
  const page = await context.newPage();
  
  try {
    // 访问抖音私信页面
    await page.goto('https://creator.douyin.com/creator-micro/data/following/chat', { waitUntil: 'networkidle' });
    console.log('抖音私信页面访问成功');
    
    // 截图保存
    await page.screenshot({ path: 'douyin-messages.png', fullPage: true });
    console.log('抖音私信页面截图已保存');
    
    // 获取页面HTML内容
    const html = await page.innerHTML('body');
    fs.writeFileSync('douyin-html.html', html);
    console.log('页面HTML内容已保存到douyin-html.html');
    
    // 检查页面是否有新消息
    const hasNewMessages = await page.evaluate(() => {
      const unreadBadges = document.querySelectorAll('[class*="unread"]');
      return unreadBadges.length > 0;
    });
    
    console.log(`是否有新消息: ${hasNewMessages}`);
    
  } catch (error) {
    console.error('访问抖音私信页面失败:', error.message);
  }
  
  // 关闭浏览器
  await browser.close();
})();
