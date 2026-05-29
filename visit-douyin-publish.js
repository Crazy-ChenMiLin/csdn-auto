const { chromium } = require('playwright');
const fs = require('fs');

async function visitDouyinPublish() {
  const publishUrl = 'https://creator.douyin.com/creator-micro/content/post/article?enter_from=publish_page&media_type=article&type=new';
  const currentTime = new Date().toISOString();

  // 使用核心的Cookie信息
  const cookies = [
    {
      "name": "sessionid",
      "value": "edb49637768c0fa3dc60f6fa3e9c1d95",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1782371189.29853,
      "httpOnly": true,
      "secure": true,
      "sameSite": "no_restriction"
    },
    {
      "name": "ttwid",
      "value": "1%7CeLbrC-30_ADNtQyXriXJLAZOMcVVW3E_7HUGywLFsMY%7C1778040312%7C7f5fdb39919064cec64551068ec2c9acbfe80988b188c632de75a812b449d93b",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1809576330.14111,
      "httpOnly": true,
      "secure": true,
      "sameSite": "no_restriction"
    },
    {
      "name": "passport_csrf_token",
      "value": "f3c82712dc7c43e6234df2c2258d984d",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 17821443446.763718,
      "httpOnly": false,
      "secure": true,
      "sameSite": "no_restriction"
    },
    {
      "name": "s_v_web_id",
      "value": "verify_mocefbb6_OijBPTYl_A73F_4yHR_9sMF_MOvxIAL7tYIo",
      "domain": "creator.douyin.com",
      "path": "/",
      "expires": 1782188212,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    }
  ];

  try {
    console.log(`${currentTime} - 开始访问抖音创作者后台文章发布页面 ${publishUrl}`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: false
    });
    
    // 设置Cookie
    await context.addCookies(cookies);
    
    const page = await context.newPage();

    // 直接访问页面
    const response = await page.goto(publishUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待页面加载完成
    await page.waitForTimeout(8000);

    // 保存页面截图
    const screenshotPath = `douyin-publish-page-cookie-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });

    console.log(`${currentTime} - 页面截图已保存到: ${screenshotPath}`);

    // 检查页面状态
    const pageTitle = await page.title();
    console.log(`${currentTime} - 页面标题: ${pageTitle}`);

    // 获取页面可见文本
    const visibleText = await page.evaluate(() => {
      return document.body.innerText;
    });
    console.log(`${currentTime} - 页面可见文本前200字符: ${visibleText.slice(0, 200)}`);

    await browser.close();
    console.log(`${currentTime} - 任务完成`);

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
  }
}

// 立即执行
visitDouyinPublish().catch(error => console.error('访问失败:', error));
