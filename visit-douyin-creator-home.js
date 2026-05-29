const { chromium } = require('playwright');
const fs = require('fs');

async function visitDouyinCreatorHome() {
  const targetUrl = 'https://creator.douyin.com/creator-micro/home';
  const currentTime = new Date().toISOString();

  // 使用用户提供的新Cookie信息（修复了sameSite属性）
  const cookies = [
    {
      "name": "__security_server_data_status",
      "value": "1",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1783225370.249341,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "sessionid",
      "value": "acbe0245f71fd900f4783665c5b7ae18",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1783225369.573804,
      "httpOnly": true,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "ttwid",
      "value": "1%7CSnkbKk0i2nSjS_L51m7q5XJT7muyeHyq9AYAmM5rz3I%7C1778041368%7Cff92dd472fe0f3f55f9a66f2cf188ca3ba7118042fee88d1b08255f6a2effa69",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1809577376.930242,
      "httpOnly": true,
      "secure": true,
      "sameSite": "None"
    }
  ];

  try {
    console.log(`${currentTime} - 开始访问抖音创作者后台首页 ${targetUrl}`);
    
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

    // 访问目标页面
    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待页面加载完成
    await page.waitForTimeout(8000);

    // 保存页面截图
    const screenshotPath = `douyin-creator-home-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });

    console.log(`${currentTime} - 页面截图已保存到: ${screenshotPath}`);

    // 检查页面状态
    const pageTitle = await page.title();
    console.log(`${currentTime} - 页面标题: ${pageTitle}`);

    await browser.close();
    console.log(`${currentTime} - 任务完成`);

  } catch (error) {
    console.error(`${currentTime} - 访问失败: ${error.message}`);
  }
}

// 立即执行
visitDouyinCreatorHome().catch(error => console.error('访问失败:', error));
