const { chromium } = require('playwright');
const fs = require('fs');

async function checkDouyinPublishPage() {
  const targetUrl = 'https://creator.douyin.com/creator-micro/content/post/article?enter_from=publish_page&media_type=article&type=new';
  const currentTime = new Date().toISOString();

  // 使用成功访问过的Cookie信息
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
    console.log(`${currentTime} - 开始检查抖音发布页面 ${targetUrl}`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: false
    });
    
    await context.addCookies(cookies);
    
    const page = await context.newPage();

    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(5000);

    // 保存页面截图
    const screenshotPath = `douyin-publish-page-check-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });
    console.log(`${currentTime} - 页面截图已保存到: ${screenshotPath}`);

    // 获取页面标题
    const pageTitle = await page.title();
    console.log(`${currentTime} - 页面标题: ${pageTitle}`);

    // 获取页面HTML内容，以便检查页面结构
    const htmlContent = await page.content();
    const htmlPath = `douyin-publish-page-${currentTime.replace(/[:.]/g, '-')}.html`;
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`${currentTime} - 页面HTML已保存到: ${htmlPath}`);

    // 获取页面可见文本，检查是否有发布失败的提示
    const visibleText = await page.textContent('body');
    console.log(`${currentTime} - 页面可见文本前300字符: ${visibleText.substring(0, 300)}`);

    // 检查文章标题输入框是否存在
    const titleInput = await page.$$('input[placeholder*="标题"]');
    console.log(`${currentTime} - 找到 ${titleInput.length} 个标题输入框`);

    // 检查文章内容输入框是否存在
    const contentInput = await page.$$('textarea[placeholder*="内容"]');
    console.log(`${currentTime} - 找到 ${contentInput.length} 个内容输入框`);

    // 检查是否有其他可能的内容输入框定位方式
    const allInputs = await page.$$('textarea');
    console.log(`${currentTime} - 找到 ${allInputs.length} 个textarea元素`);

    // 检查发布按钮是否存在
    const publishButtons = await page.$$('button:has-text("发布")');
    console.log(`${currentTime} - 找到 ${publishButtons.length} 个发布按钮`);

    // 检查是否有草稿或发布状态信息
    const statusText = await page.textContent('.publish-status, .draft-status, .submit-status');
    if (statusText) {
      console.log(`${currentTime} - 发布状态信息: ${statusText}`);
    }

    await browser.close();
    console.log(`${currentTime} - 任务完成`);

  } catch (error) {
    console.error(`${currentTime} - 访问失败: ${error.message}`);
  }
}

checkDouyinPublishPage().catch(error => console.error('检查失败:', error));
