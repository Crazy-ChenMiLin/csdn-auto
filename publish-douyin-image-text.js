const { chromium } = require('playwright');
const fs = require('fs');

async function publishDouyinImageText() {
  // 图文发布页面 URL（根据用户描述，可能是从首页跳转过来的）
  const targetUrl = 'https://creator.douyin.com/creator-micro/content/post/image-text?enter_from=publish_page&media_type=image&type=new';
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

  let browser, context, page;

  try {
    console.log(`${currentTime} - 开始访问抖音图文发布页面 ${targetUrl}`);
    
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

    // 访问图文发布页面
    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(8000);

    // 保存初始页面截图
    const initialScreenshot = `douyin-image-text-initial-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    console.log(`${currentTime} - 初始页面截图已保存: ${initialScreenshot}`);

    // 获取页面可见文本检查是否有图文发布相关内容
    const visibleText = await page.textContent('body');
    console.log(`${currentTime} - 页面可见文本前500字符: ${visibleText.substring(0, 500)}`);

    // 查找图片上传区域（图文发布主要是上传图片）
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
      // 检查是否为文件输入框
      const tagName = await uploadElement.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'input' && await uploadElement.evaluate(el => el.type === 'file')) {
        console.log(`${currentTime} - 找到文件上传输入框`);
        // 上传项目中现有的示例图片
        const imagePath = '/home/node/.openclaw/workspace/playwright-example.png';
        if (fs.existsSync(imagePath)) {
          await uploadElement.setInputFiles(imagePath);
          console.log(`${currentTime} - 图片上传成功: ${imagePath}`);
          await page.waitForTimeout(5000); // 等待上传完成
          
          // 保存上传后的截图
          const uploadScreenshot = `douyin-image-text-uploaded-${currentTime.replace(/[:.]/g, '-')}.png`;
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

    // 查找发布按钮
    console.log(`${currentTime} - 查找发布按钮`);
    
    const publishSelectors = [
      'button:has-text("发布")',
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
      // 检查按钮是否可点击
      const isEnabled = await publishButton.evaluate(el => !el.disabled);
      if (isEnabled) {
        console.log(`${currentTime} - 发布按钮可点击，尝试点击`);
        await publishButton.click();
        await page.waitForTimeout(10000); // 等待发布过程
        
        // 保存发布后的截图
        const publishScreenshot = `douyin-image-text-published-${currentTime.replace(/[:.]/g, '-')}.png`;
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
      console.log(`${currentTime} - 未找到发布按钮`);
    }

    // 保存最终状态截图
    const finalScreenshot = `douyin-image-text-final-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`${currentTime} - 最终页面截图已保存: ${finalScreenshot}`);

    await browser.close();
    console.log(`${currentTime} - 图文发布测试完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `douyin-image-text-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

// 立即执行测试
publishDouyinImageText().catch(error => console.error('图文发布测试失败:', error));
