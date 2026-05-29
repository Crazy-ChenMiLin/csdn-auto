const { chromium } = require('playwright');
const fs = require('fs');

async function detailedNetworkAnalysis() {
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
    console.log(`${currentTime} - 开始详细网络分析`);
    
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

    // 启用详细的网络请求拦截
    const allNetworkData = [];
    
    page.on('request', request => {
      const requestInfo = {
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: new Date().toISOString()
      };
      
      if (request.method() === 'POST') {
        try {
          const postData = request.postData();
          if (postData) {
            requestInfo.data = postData.length > 1000 ? postData.substring(0, 1000) + '...' : postData;
          }
        } catch (error) {
          console.log(`${currentTime} - 无法获取请求数据: ${error.message}`);
        }
      }
      
      allNetworkData.push(requestInfo);
      
      if (request.url().includes('/aweme/') || request.url().includes('/api/') || request.url().includes('/publish/') || request.url().includes('upload')) {
        console.log(`${currentTime} - [${request.method()}] ${request.url()}`);
      }
    });

    page.on('response', async response => {
      const responseInfo = {
        type: 'response',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: new Date().toISOString()
      };
      
      // 尝试获取响应数据
      try {
        const text = await response.text();
        responseInfo.data = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
      } catch (error) {
        console.log(`${currentTime} - 无法获取响应数据: ${error.message}`);
      }
      
      allNetworkData.push(responseInfo);
      
      if (response.url().includes('/aweme/') || response.url().includes('/api/') || response.url().includes('/publish/') || response.url().includes('upload')) {
        console.log(`${currentTime} - [${response.status()}] ${response.url()}`);
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
        console.log(`${currentTime} - 找到文件输入框，上传示例图片`);
        await fileInput.setInputFiles(imagePath);
        await page.waitForTimeout(8000);
      }
    }

    const beforePublishScreenshot = `network-before-publish-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: beforePublishScreenshot, fullPage: true });
    console.log(`${currentTime} - 上传后截图已保存: ${beforePublishScreenshot}`);

    // 点击发布按钮
    const publishBtn = await page.$('button:has-text("高清发布")');
    if (publishBtn) {
      const isDisabled = await publishBtn.evaluate(el => el.disabled);
      
      if (!isDisabled) {
        console.log(`${currentTime} - 找到"高清发布"按钮，可点击`);
        
        // 等待点击后的响应
        const [publishResponse] = await Promise.all([
          page.waitForResponse(response => 
            (response.url().includes('/api/') || 
             response.url().includes('/aweme/') || 
             response.url().includes('/publish/') || 
             response.url().includes('upload')) &&
            response.status() !== 204,
            { timeout: 30000 }
          ).catch(error => {
            console.log(`${currentTime} - 未捕获到发布响应: ${error.message}`);
            return null;
          }),
          publishBtn.click()
        ]);

        if (publishResponse) {
          console.log(`${currentTime} - 捕获到发布响应: ${publishResponse.status()} ${publishResponse.url()}`);
          
          try {
            const responseText = await publishResponse.text();
            const responsePath = `detailed-publish-response-${currentTime.replace(/[:.]/g, '-')}.txt`;
            fs.writeFileSync(responsePath, responseText);
            console.log(`${currentTime} - 发布响应内容已保存到: ${responsePath}`);
            
            if (responseText.includes('发布成功') || responseText.includes('待审核') || responseText.includes('已发布')) {
              console.log(`${currentTime} - 响应中包含成功提示`);
            } else if (responseText.includes('错误') || responseText.includes('失败') || responseText.includes('必填')) {
              console.log(`${currentTime} - 响应中包含错误或必填提示`);
            }
          } catch (error) {
            console.log(`${currentTime} - 无法解析响应内容: ${error.message}`);
          }
        }
      } else {
        console.log(`${currentTime} - "高清发布"按钮已禁用`);
      }
    }

    await page.waitForTimeout(10000);

    const afterPublishScreenshot = `network-after-publish-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: afterPublishScreenshot, fullPage: true });
    console.log(`${currentTime} - 点击发布后截图已保存: ${afterPublishScreenshot}`);

    // 保存完整网络数据
    const networkPath = `detailed-network-analysis-${currentTime.replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(networkPath, JSON.stringify(allNetworkData, null, 2));
    console.log(`${currentTime} - 完整网络数据已保存到: ${networkPath}`);

    // 检查页面变化
    const pageContent = await page.content();
    if (pageContent.includes('发布成功') || pageContent.includes('待审核') || pageContent.includes('已发布')) {
      console.log(`${currentTime} - ✅ 找到成功提示`);
    } else if (pageContent.includes('错误') || pageContent.includes('失败') || pageContent.includes('必填')) {
      console.log(`${currentTime} - ❌ 找到错误或必填提示`);
    } else {
      console.log(`${currentTime} - ℹ️  未找到明确的反馈信息`);
    }

    await browser.close();
    console.log(`${currentTime} - 详细网络分析完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `detailed-network-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

detailedNetworkAnalysis().catch(error => console.error('详细网络分析失败:', error));
