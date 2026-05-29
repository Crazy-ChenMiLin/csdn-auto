const { chromium } = require('playwright');
const fs = require('fs');

async function publishDouyinArticle() {
  const targetUrl = 'https://creator.douyin.com/creator-micro/content/post/article?enter_from=publish_page&media_type=article&type=new';
  const currentTime = new Date().toISOString();

  // 使用成功访问过首页的核心Cookie信息
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
    },
    {
      "name": "passport_csrf_token",
      "value": "b51b888bd168593833e6b0c3408820db",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1783225295.716838,
      "httpOnly": false,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "csrf_session_id",
      "value": "9ac1e5b8599e8387a1793925bea1bb9e",
      "domain": "creator.douyin.com",
      "path": "/",
      "expires": 0,
      "httpOnly": false,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "d_ticket",
      "value": "230653f064bcedc38554b38bd789e75fd95c7",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1809577368.866497,
      "httpOnly": true,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "x-web-secsdk-uid",
      "value": "4da56938-568e-47f7-99e1-e0e23605d345",
      "domain": "creator.douyin.com",
      "path": "/",
      "expires": 0,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    }
  ];

  try {
    console.log(`${currentTime} - 开始发布抖音文章 ${targetUrl}`);
    
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

    // 访问发布页面
    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待页面加载完成
    await page.waitForTimeout(8000);

    // 保存页面截图
    const screenshotPath = `douyin-publish-page-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });

    console.log(`${currentTime} - 发布页面截图已保存到: ${screenshotPath}`);

    // 检查页面状态
    const pageTitle = await page.title();
    console.log(`${currentTime} - 页面标题: ${pageTitle}`);

    // 简单的文章内容
    const articleTitle = "测试文章";
    const articleContent = "这是一篇测试文章，用于验证抖音创作者后台的自动化发布功能。";

    // 尝试填写文章标题和内容
    try {
      // 查找标题输入框
      const titleInput = await page.$('input[placeholder*="标题"]');
      if (titleInput) {
        await titleInput.fill(articleTitle);
        console.log(`${currentTime} - 文章标题已填写`);
      }

      // 查找内容输入框
      const contentInput = await page.$('textarea[placeholder*="内容"]');
      if (contentInput) {
        await contentInput.fill(articleContent);
        console.log(`${currentTime} - 文章内容已填写`);
      }

      // 尝试找到发布按钮并点击
      const publishButton = await page.$('button:has-text("发布")');
      if (publishButton) {
        await publishButton.click();
        console.log(`${currentTime} - 发布按钮已点击`);
        
        // 等待发布成功
        await page.waitForTimeout(5000);
        
        // 保存发布后的截图
        const publishResultPath = `douyin-publish-result-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ 
          path: publishResultPath,
          fullPage: true
        });
        console.log(`${currentTime} - 发布结果截图已保存到: ${publishResultPath}`);
      } else {
        console.log(`${currentTime} - 未找到发布按钮`);
      }

    } catch (fillError) {
      console.error(`${currentTime} - 填写文章内容失败: ${fillError.message}`);
    }

    await browser.close();
    console.log(`${currentTime} - 任务完成`);

  } catch (error) {
    console.error(`${currentTime} - 发布失败: ${error.message}`);
  }
}

// 立即执行
publishDouyinArticle().catch(error => console.error('发布失败:', error));
