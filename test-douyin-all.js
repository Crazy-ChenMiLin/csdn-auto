const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const cookiesData = JSON.parse(fs.readFileSync('/home/node/.openclaw/workspace/douyin_cookies.json', 'utf8'));
  const cookies = cookiesData.cookies;
  
  try {
    // 启动浏览器，使用更快速的配置
    const browser = await chromium.launch({ 
      headless: true, 
      args: [
        '--disable-gpu', 
        '--no-sandbox', 
        '--disable-dev-shm-usage',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        '--window-size=1920,1080'
      ]
    });
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();
    
    let messagesResult = { hasNewMessages: false, messageCount: 0 };
    let commentsResult = { hasNewComments: false, commentCount: 0 };
    
    // 访问抖音私信页面
    try {
      await page.goto('https://creator.douyin.com/creator-micro/data/following/chat', { waitUntil: 'domcontentloaded', timeout: 10000 });
      console.log('抖音私信页面访问成功');
      
      messagesResult = await page.evaluate(() => {
        const messageItems = document.querySelectorAll('[data-e2e="message-item"]');
        return {
          hasNewMessages: messageItems.length > 0,
          messageCount: messageItems.length
        };
      });
      
      console.log(`是否有新消息: ${messagesResult.hasNewMessages}`);
      console.log(`消息数量: ${messagesResult.messageCount}`);
    } catch (error) {
      console.error('访问抖音私信页面失败:', error.message);
    }
    
    // 访问抖音评论区页面
    try {
      await page.goto('https://creator.douyin.com/creator-micro/interactive/comment', { waitUntil: 'domcontentloaded', timeout: 10000 });
      console.log('抖音评论区页面访问成功');
      
      commentsResult = await page.evaluate(() => {
        const commentItems = document.querySelectorAll('[data-e2e="comment-item"]');
        return {
          hasNewComments: commentItems.length > 0,
          commentCount: commentItems.length
        };
      });
      
      console.log(`是否有新评论: ${commentsResult.hasNewComments}`);
      console.log(`评论数量: ${commentsResult.commentCount}`);
    } catch (error) {
      console.error('访问抖音评论区页面失败:', error.message);
    }
    
    await browser.close();
    
    return {
      messages: messagesResult,
      comments: commentsResult
    };
    
  } catch (error) {
    console.error('浏览器启动失败:', error.message);
    return {
      messages: { hasNewMessages: false, messageCount: 0 },
      comments: { hasNewComments: false, commentCount: 0 }
    };
  }
})();
