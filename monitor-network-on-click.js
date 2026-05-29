const { chromium } = require('playwright');
const fs = require('fs');

async function monitorNetworkOnClick() {
  const targetUrl = 'https://creator.douyin.com/creator-micro/content/upload';
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
  const networkEvents = [];

  try {
    console.log(`${currentTime} - 开始监控点击时的网络请求`);
    
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

    // 监控网络请求和响应
    page.on('request', (request) => {
      const requestData = {
        type: 'request',
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      };
      
      if (request.url().includes('publish') || request.url().includes('upload') || request.url().includes('submit') || request.url().includes('content')) {
        console.log(`${currentTime} - 请求: ${request.method()} ${request.url()}`);
        networkEvents.push(requestData);
      }
    });

    page.on('response', (response) => {
      const responseData = {
        type: 'response',
        status: response.status(),
        url: response.url(),
        timestamp: new Date().toISOString()
      };
      
      if (response.url().includes('publish') || response.url().includes('upload') || response.url().includes('submit') || response.url().includes('content')) {
        console.log(`${currentTime} - 响应: ${response.status()} ${response.url()}`);
        networkEvents.push(responseData);
        
        // 检查是否有与发布相关的响应
        if (response.url().includes('publish') && response.status() === 200) {
          response.text().then(text => {
            console.log(`${currentTime} - 发布响应内容: ${text.slice(0, 500)}...`);
            fs.writeFileSync(`publish-response-${currentTime.replace(/[:.]/g, '-')}.txt`, text);
          }).catch(error => {
            console.log(`${currentTime} - 无法获取响应内容: ${error.message}`);
          });
        }
      }
    });

    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(3000);

    // 找到"高清发布"按钮
    const publishButton = await page.$('button:has-text("高清发布")');
    if (publishButton) {
      console.log(`${currentTime} - 找到"高清发布"按钮`);
      
      // 点击按钮并监控网络请求
      await Promise.all([
        publishButton.click(),
        new Promise(resolve => setTimeout(resolve, 8000)) // 等待8秒以捕获网络请求
      ]);

      console.log(`${currentTime} - 按钮点击后等待结束`);

      // 保存网络事件
      const networkEventsPath = `network-events-on-click-${currentTime.replace(/[:.]/g, '-')}.json`;
      fs.writeFileSync(networkEventsPath, JSON.stringify(networkEvents, null, 2));
      console.log(`${currentTime} - 网络事件已保存到: ${networkEventsPath}`);

      // 检查网络事件中是否有与发布相关的请求
      const publishEvents = networkEvents.filter(event => 
        event.url.includes('publish') || event.url.includes('submit')
      );
      
      if (publishEvents.length > 0) {
        console.log(`${currentTime} - 找到 ${publishEvents.length} 个与发布相关的网络事件`);
        
        for (let i = 0; i < publishEvents.length; i++) {
          console.log(`${currentTime} - 事件 ${i}: ${publishEvents[i].type} ${publishEvents[i].method || publishEvents[i].status} ${publishEvents[i].url}`);
        }
      } else {
        console.log(`${currentTime} - 未找到与发布相关的网络事件`);
        console.log(`${currentTime} - 所有网络事件: ${networkEvents.length} 个`);
        
        // 打印所有网络事件类型和URL
        console.log(`${currentTime} - 所有事件详情:`);
        for (let i = 0; i < networkEvents.length; i++) {
          const event = networkEvents[i];
          console.log(`${currentTime} - 事件 ${i}: ${event.type} ${event.method || event.status} ${event.url}`);
        }
      }
    } else {
      console.log(`${currentTime} - 未找到"高清发布"按钮`);
    }

    // 保存页面截图
    const finalScreenshot = `monitor-network-on-click-final-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`${currentTime} - 最终截图已保存: ${finalScreenshot}`);

    await browser.close();
    console.log(`${currentTime} - 网络监控完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `monitor-network-on-click-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

monitorNetworkOnClick().catch(error => console.error('网络监控失败:', error));
