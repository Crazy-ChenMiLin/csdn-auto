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
    // 访问抖音私信页面，使用较短的超时时间和不同的等待策略
    await page.goto('https://creator.douyin.com/creator-micro/data/following/chat', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('抖音私信页面访问成功');
    
    // 检查是否有新消息（使用单次evaluate避免重复操作）
    const { hasNewMessages, messageCount } = await page.evaluate(() => {
      const messageItems = document.querySelectorAll('[data-e2e="message-item"]');
      return {
        hasNewMessages: messageItems.length > 0,
        messageCount: messageItems.length
      };
    });
    
    console.log(`是否有新消息: ${hasNewMessages}`);
    console.log(`消息数量: ${messageCount}`);
    
  } catch (error) {
    console.error('访问抖音私信页面失败:', error.message);
    // 简化错误信息输出
  }
  
  // 关闭浏览器
  await browser.close();
})();
