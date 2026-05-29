const { chromium } = require('playwright');
const fs = require('fs');

async function advancedDouyinPublish() {
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

  // 配置参数
  const config = {
    timeout: 60000,
    pageLoadTimeout: 8000,
    inputTimeout: 3000,
    publishWaitTime: 10000,
    title: "测试标题",
    content: "这是测试内容，用于验证抖音自动化发布"
  };

  let browser, context, page;

  try {
    console.log(`${currentTime} - 开始访问抖音发布页面 ${targetUrl}`);
    
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: false
    });
    
    await context.addCookies(cookies);
    
    page = await context.newPage();

    // 监听网络请求，用于调试
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

    const response = await page.goto(targetUrl, {
      timeout: config.timeout,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(config.pageLoadTimeout);

    // 保存页面截图
    const initialScreenshot = `douyin-publish-initial-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    console.log(`${currentTime} - 初始页面截图已保存: ${initialScreenshot}`);

    // 查找并填写标题输入框（更稳定的方法）
    try {
      console.log(`${currentTime} - 查找标题输入框`);
      // 等待标题输入框可见
      await page.waitForSelector('input[placeholder*="标题"]', { visible: true, timeout: 10000 });
      
      const titleInput = await page.$('input[placeholder*="标题"]');
      if (titleInput) {
        await titleInput.fill(config.title);
        console.log(`${currentTime} - 标题已填写: ${config.title}`);
        
        // 验证填写是否成功
        const filledTitle = await titleInput.evaluate(el => el.value);
        if (filledTitle === config.title) {
          console.log(`${currentTime} - 标题填写验证成功`);
        } else {
          console.log(`${currentTime} - 标题填写验证失败，实际值: ${filledTitle}`);
        }
      }
    } catch (error) {
      console.error(`${currentTime} - 标题输入框处理失败: ${error.message}`);
    }

    // 查找并填写内容输入框（更稳定的方法）
    try {
      console.log(`${currentTime} - 查找内容输入框`);
      // 等待内容输入框可见
      await page.waitForSelector('div[contenteditable="true"]', { visible: true, timeout: 10000 });
      
      const contentInput = await page.$('div[contenteditable="true"]');
      if (contentInput) {
        // 确保输入框聚焦并清除内容
        await contentInput.focus();
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        
        await page.keyboard.type(config.content);
        console.log(`${currentTime} - 内容已填写`);
        
        // 验证填写是否成功
        const filledContent = await contentInput.textContent();
        if (filledContent.includes(config.content.substring(0, 5))) {
          console.log(`${currentTime} - 内容填写验证成功`);
        } else {
          console.log(`${currentTime} - 内容填写验证失败，实际值前20字符: ${filledContent.substring(0, 20)}`);
        }
      }
    } catch (error) {
      console.error(`${currentTime} - 内容输入框处理失败: ${error.message}`);
    }

    // 查找并点击发布按钮
    try {
      console.log(`${currentTime} - 查找发布按钮`);
      // 等待发布按钮可见
      await page.waitForSelector('button:has-text("发布")', { visible: true, timeout: 10000 });
      
      const publishButton = await page.$('button:has-text("发布")');
      if (publishButton) {
        const isEnabled = await publishButton.evaluate(el => !el.disabled);
        if (isEnabled) {
          console.log(`${currentTime} - 发布按钮可点击，尝试点击`);
          await publishButton.click();
          
          // 等待发布操作完成
          await page.waitForTimeout(config.publishWaitTime);
          
          const publishScreenshot = `douyin-publish-result-${currentTime.replace(/[:.]/g, '-')}.png`;
          await page.screenshot({ path: publishScreenshot, fullPage: true });
          console.log(`${currentTime} - 发布后截图已保存: ${publishScreenshot}`);
          
          // 检查是否有成功提示
          try {
            const successElements = await page.$$('text=发布成功, text=已发布');
            if (successElements.length > 0) {
              console.log(`${currentTime} - 发布成功提示已找到`);
            } else {
              console.log(`${currentTime} - 未找到明确的发布成功提示`);
              
              // 检查是否有URL变化
              if (page.url() !== targetUrl) {
                console.log(`${currentTime} - 页面URL已变化: ${page.url()}`);
              }
            }
          } catch (checkError) {
            console.error(`${currentTime} - 检查发布成功提示失败: ${checkError.message}`);
          }
        } else {
          console.log(`${currentTime} - 发布按钮不可点击`);
          // 获取按钮不可点击的原因
          const buttonText = await publishButton.textContent();
          const buttonClass = await publishButton.evaluate(el => el.className);
          console.log(`${currentTime} - 按钮文本: ${buttonText}, 类名: ${buttonClass}`);
        }
      }
    } catch (error) {
      console.error(`${currentTime} - 发布按钮处理失败: ${error.message}`);
    }

    const finalScreenshot = `douyin-publish-final-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`${currentTime} - 最终页面截图已保存: ${finalScreenshot}`);

    await browser.close();
    console.log(`${currentTime} - 任务完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `douyin-publish-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

advancedDouyinPublish().catch(error => console.error('任务失败:', error));
