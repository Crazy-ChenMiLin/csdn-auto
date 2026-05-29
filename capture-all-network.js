const { chromium } = require('playwright');
const fs = require('fs');

async function captureAllNetwork() {
  const targetUrl = 'https://creator.douyin.com/creator-micro/content/post/image-text?enter_from=publish_page&media_type=image&type=new';
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
    console.log(`${currentTime} - 开始全面网络监控`);
    
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

    const allNetworkEvents = [];

    // 监听所有网络请求
    page.on('request', request => {
      const event = {
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: new Date().toISOString()
      };
      
      if (request.method() === 'POST') {
        try {
          event.postData = request.postData();
        } catch (e) {
          event.postData = '无法获取';
        }
      }
      
      allNetworkEvents.push(event);
      
      if (request.url().includes('/api/') || request.url().includes('/aweme/') || request.url().includes('/publish/')) {
        console.log(`${currentTime} - 请求: [${request.method()}] ${request.url()}`);
        if (request.method() === 'POST' && request.postData()) {
          const data = request.postData().length > 200 ? request.postData().substring(0, 200) + '...' : request.postData();
          console.log(`${currentTime} - 请求数据: ${data}`);
        }
      }
    });

    // 监听所有网络响应
    page.on('response', async response => {
      const event = {
        type: 'response',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: new Date().toISOString()
      };
      
      try {
        const text = await response.text();
        event.responseText = text;
        if (text.length > 200) {
          event.responsePreview = text.substring(0, 200) + '...';
        } else {
          event.responsePreview = text;
        }
      } catch (e) {
        event.responseText = '无法获取';
      }
      
      allNetworkEvents.push(event);
      
      if (response.url().includes('/api/') || response.url().includes('/aweme/') || response.url().includes('/publish/')) {
        console.log(`${currentTime} - 响应: [${response.status()}] ${response.url()}`);
        if (event.responsePreview) {
          console.log(`${currentTime} - 响应预览: ${event.responsePreview}`);
        }
      }
    });

    // 访问页面
    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(5000);

    // 上传图片
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      const imagePath = '/home/node/.openclaw/workspace/playwright-example.png';
      if (fs.existsSync(imagePath)) {
        console.log(`${currentTime} - 上传示例图片`);
        await fileInput.setInputFiles(imagePath);
        await page.waitForTimeout(8000);
      }
    }

    // 点击发布按钮
    const publishBtn = await page.$('button:has-text("高清发布")');
    if (publishBtn) {
      console.log(`${currentTime} - 点击发布按钮`);
      
      // 等待按钮点击后的网络活动
      await Promise.all([
        publishBtn.click(),
        page.waitForTimeout(15000)
      ]);
    }

    // 保存网络事件记录
    const networkPath = `all-network-events-${currentTime.replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(networkPath, JSON.stringify(allNetworkEvents, null, 2));
    console.log(`${currentTime} - 网络事件已保存到: ${networkPath}`);

    // 保存页面截图
    const screenshot = `capture-all-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log(`${currentTime} - 页面截图已保存: ${screenshot}`);

    // 检查页面上的提示信息
    const pageText = await page.textContent('body');
    const hasSuccess = pageText.includes('发布成功') || pageText.includes('待审核');
    const hasError = pageText.includes('错误') || pageText.includes('失败');
    const hasRequired = pageText.includes('必填') || pageText.includes('请输入');

    console.log(`${currentTime} - 页面内容分析:`);
    console.log(`${currentTime} -   - 成功提示: ${hasSuccess}`);
    console.log(`${currentTime} -   - 错误提示: ${hasError}`);
    console.log(`${currentTime} -   - 必填提示: ${hasRequired}`);

    // 统计网络请求类型
    const apiCount = allNetworkEvents.filter(event => 
      event.url.includes('/api/') || event.url.includes('/aweme/') || event.url.includes('/publish/')
    ).length;
    const postCount = allNetworkEvents.filter(event => event.method === 'POST').length;
    const getCount = allNetworkEvents.filter(event => event.method === 'GET').length;

    console.log(`${currentTime} - 网络请求统计:`);
    console.log(`${currentTime} -   - 总请求数: ${allNetworkEvents.length}`);
    console.log(`${currentTime} -   - API请求数: ${apiCount}`);
    console.log(`${currentTime} -   - POST请求: ${postCount}`);
    console.log(`${currentTime} -   - GET请求: ${getCount}`);

    // 检查是否有发布相关的API请求
    const publishRequests = allNetworkEvents.filter(event => 
      event.type === 'request' && (
        event.url.includes('/aweme/v1/create/') || 
        event.url.includes('/api/v1/publish/') || 
        event.url.includes('/aweme/v1/content/publish/')
      )
    );

    if (publishRequests.length > 0) {
      console.log(`${currentTime} - 找到发布相关的API请求:`);
      publishRequests.forEach(request => {
        console.log(`${currentTime} -   - [${request.method}] ${request.url}`);
        if (request.postData) {
          const data = request.postData.length > 200 ? request.postData.substring(0, 200) + '...' : request.postData;
          console.log(`${currentTime} -   - 数据: ${data}`);
        }
      });
    } else {
      console.log(`${currentTime} - 未找到明确的发布相关API请求`);
      console.log(`${currentTime} - 所有请求URL包含的关键词:`);
      const allKeywords = new Set();
      allNetworkEvents.forEach(event => {
        const url = event.url;
        ['aweme', 'api', 'publish', 'upload', 'content', 'create', 'submit'].forEach(keyword => {
          if (url.includes(keyword)) {
            allKeywords.add(keyword);
          }
        });
      });
      console.log(`${currentTime} -   - ${Array.from(allKeywords).join(', ')}`);
    }

    await browser.close();
    console.log(`${currentTime} - 网络监控完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `capture-all-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

captureAllNetwork().catch(error => console.error('网络监控失败:', error));
