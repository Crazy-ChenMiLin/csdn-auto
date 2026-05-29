const { chromium } = require('playwright');
const fs = require('fs');

async function detailedPublishTest() {
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
    console.log(`${currentTime} - 开始详细图文发布测试`);
    
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

    // 添加网络请求监听
    page.on('request', request => {
      if (request.url().includes('aweme') || request.url().includes('api')) {
        console.log(`${currentTime} - 请求: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('aweme') || response.url().includes('api')) {
        console.log(`${currentTime} - 响应: ${response.status()} ${response.url()}`);
      }
    });

    // 访问图文发布页面
    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(8000);

    const initialScreenshot = `douyin-detailed-initial-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    console.log(`${currentTime} - 初始页面截图已保存: ${initialScreenshot}`);

    // 查找图片上传区域
    console.log(`${currentTime} - 查找图片上传区域`);
    
    const uploadSelectors = [
      'input[type="file"]',
      'div[role="button"]:has-text("上传")',
      '.upload-container',
      '[data-testid*="upload"]',
      'button:has-text("上传图片")'
    ];

    let uploadElement;
    for (const selector of uploadSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          uploadElement = elements[0];
          console.log(`${currentTime} - 图片上传区域找到，使用选择器: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (uploadElement) {
      const tagName = await uploadElement.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'input' && await uploadElement.evaluate(el => el.type === 'file')) {
        console.log(`${currentTime} - 找到文件上传输入框`);
        const imagePath = '/home/node/.openclaw/workspace/playwright-example.png';
        if (fs.existsSync(imagePath)) {
          await uploadElement.setInputFiles(imagePath);
          console.log(`${currentTime} - 图片上传成功: ${imagePath}`);
          await page.waitForTimeout(5000);
          
          const uploadScreenshot = `douyin-detailed-uploaded-${currentTime.replace(/[:.]/g, '-')}.png`;
          await page.screenshot({ path: uploadScreenshot, fullPage: true });
          console.log(`${currentTime} - 图片上传后截图已保存: ${uploadScreenshot}`);
        } else {
          console.log(`${currentTime} - 示例图片不存在: ${imagePath}`);
        }
      } else {
        console.log(`${currentTime} - 需要点击上传按钮`);
        await uploadElement.click();
        await page.waitForTimeout(3000);
      }
    } else {
      console.log(`${currentTime} - 未找到图片上传区域`);
    }

    // 查找并点击"高清发布"按钮
    console.log(`${currentTime} - 查找"高清发布"按钮`);
    
    const publishSelectors = [
      'button:has-text("高清发布")',
      '.publish-btn',
      '[data-button-type="publish"]',
      'button[title*="发布"]'
    ];

    let publishButton;
    for (const selector of publishSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          publishButton = elements[0];
          console.log(`${currentTime} - 发布按钮找到，使用选择器: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (publishButton) {
      const isEnabled = await publishButton.evaluate(el => !el.disabled);
      if (isEnabled) {
        console.log(`${currentTime} - 发布按钮可点击，尝试点击`);
        
        // 点击按钮并监听点击后的状态变化
        const [response] = await Promise.all([
          page.waitForResponse(response => 
            response.url().includes('api') || 
            response.url().includes('aweme') || 
            response.url().includes('publish'), 
            { timeout: 30000 }
          ).catch(error => {
            console.log(`${currentTime} - 未捕获到发布相关的响应: ${error.message}`);
            return null;
          }),
          publishButton.click()
        ]);

        if (response) {
          console.log(`${currentTime} - 捕获到发布响应: ${response.status()} ${response.url()}`);
          // 尝试读取响应内容
          try {
            const responseBody = await response.text();
            console.log(`${currentTime} - 响应内容前500字符: ${responseBody.substring(0, 500)}`);
            fs.writeFileSync(`douyin-publish-response-${currentTime.replace(/[:.]/g, '-')}.txt`, responseBody);
            console.log(`${currentTime} - 响应内容已保存到文件`);
          } catch (parseError) {
            console.log(`${currentTime} - 无法解析响应内容: ${parseError.message}`);
          }
        }

        await page.waitForTimeout(10000);
        
        const publishScreenshot = `douyin-detailed-published-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: publishScreenshot, fullPage: true });
        console.log(`${currentTime} - 发布后截图已保存: ${publishScreenshot}`);
        
        // 检查是否有成功或待审核提示
        const pageText = await page.textContent('body');
        if (pageText.includes('发布成功') || pageText.includes('已发布')) {
          console.log(`${currentTime} - 图文发布成功`);
        } else if (pageText.includes('审核') || pageText.includes('待审核')) {
          console.log(`${currentTime} - 图文已提交，正在待审核`);
        } else {
          console.log(`${currentTime} - 发布操作已执行，但未找到明确的状态提示`);
        }
      } else {
        console.log(`${currentTime} - 发布按钮不可点击`);
      }
    } else {
      console.log(`${currentTime} - 未找到"高清发布"按钮`);
    }

    // 保存最终状态截图
    const finalScreenshot = `douyin-detailed-final-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`${currentTime} - 最终页面截图已保存: ${finalScreenshot}`);

    // 保存页面的HTML内容
    const pageContent = await page.content();
    fs.writeFileSync(`douyin-detailed-page-content-${currentTime.replace(/[:.]/g, '-')}.html`, pageContent);
    console.log(`${currentTime} - 页面HTML内容已保存`);

    await browser.close();
    console.log(`${currentTime} - 详细图文发布测试完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `douyin-detailed-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

detailedPublishTest().catch(error => console.error('详细图文发布测试失败:', error));
