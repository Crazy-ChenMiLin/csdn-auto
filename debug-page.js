const { chromium } = require('playwright');
const fs = require('fs');

async function debugPage() {
  const targetUrl = 'https://creator.douyin.com/creator-micro/content/post/video?enter_from=publish_page&media_type=video&type=new';
  const currentTime = new Date().toISOString();

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

  let browser, context, page;

  try {
    console.log(`${currentTime} - 开始调试页面`);
    
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: true
    });
    
    await context.addCookies(cookies);
    
    page = await context.newPage();

    // 监听控制台消息
    page.on('console', async (msg) => {
      console.log(`${currentTime} - 控制台消息: ${msg.text()}`);
    });

    // 监听网络请求和响应
    page.on('request', (request) => {
      console.log(`${currentTime} - 请求: ${request.method()} ${request.url()}`);
    });

    page.on('response', (response) => {
      console.log(`${currentTime} - 响应: ${response.status()} ${response.url()}`);
    });

    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(3000);

    // 截图
    const initialScreenshot = `debug-page-initial-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    console.log(`${currentTime} - 初始截图已保存: ${initialScreenshot}`);

    // 保存页面HTML
    const pageHTML = await page.content();
    const htmlPath = `debug-page-html-${currentTime.replace(/[:.]/g, '-')}.html`;
    fs.writeFileSync(htmlPath, pageHTML);
    console.log(`${currentTime} - 页面HTML已保存: ${htmlPath}`);

    // 打印页面标题
    console.log(`${currentTime} - 页面标题: ${await page.title()}`);

    // 打印页面可见文本
    const visibleText = await page.textContent('body');
    const textPath = `debug-page-text-${currentTime.replace(/[:.]/g, '-')}.txt`;
    fs.writeFileSync(textPath, visibleText);
    console.log(`${currentTime} - 页面可见文本已保存: ${textPath}`);

    // 查找所有可能的上传区域
    const uploadElements = await page.$$('input, button, div[class*="upload"], div[class*="file"], .upload-area, .drag-area');
    console.log(`${currentTime} - 找到 ${uploadElements.length} 个可能的上传相关元素`);

    // 打印所有可能的上传区域信息
    for (let i = 0; i < uploadElements.length; i++) {
      const element = uploadElements[i];
      const tagName = await element.evaluate(el => el.tagName);
      const classes = await element.evaluate(el => el.className);
      
      if (tagName === 'INPUT') {
        const type = await element.getAttribute('type');
        const name = await element.getAttribute('name');
        const accept = await element.getAttribute('accept');
        
        console.log(`${currentTime} - 元素 ${i + 1}: INPUT, type=${type}, name=${name}, accept=${accept}, class=${classes}`);
      } else if (tagName === 'BUTTON') {
        const text = await element.textContent();
        console.log(`${currentTime} - 元素 ${i + 1}: BUTTON, text="${text.trim()}", class=${classes}`);
      } else {
        const text = await element.textContent();
        console.log(`${currentTime} - 元素 ${i + 1}: ${tagName}, text="${text.trim().slice(0, 50)}...", class=${classes}`);
      }
    }

    // 检查是否有iframe
    const frames = page.frames();
    console.log(`${currentTime} - 页面有 ${frames.length} 个框架`);
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      console.log(`${currentTime} - 框架 ${i + 1}: ${frame.name() || '无名称'}, url=${frame.url()}`);
    }

    await browser.close();
    console.log(`${currentTime} - 调试完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `debug-page-error-${currentTime.replace(/[:.]/g, '-')}.png`;
      try {
        await page.screenshot({ path: errorScreenshot, fullPage: true });
        console.log(`${currentTime} - 错误截图已保存: ${errorScreenshot}`);
      } catch (screenshotError) {
        console.error(`${currentTime} - 截图保存失败: ${screenshotError.message}`);
      }
    }
    if (browser) {
      await browser.close();
    }
  }
}

debugPage().catch(error => console.error('调试页面失败:', error));
