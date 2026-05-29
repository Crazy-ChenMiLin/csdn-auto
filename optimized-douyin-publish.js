const { chromium } = require('playwright');
const fs = require('fs');

async function optimizedDouyinPublish() {
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
    console.log(`${currentTime} - 开始访问抖音发布页面 ${targetUrl}`);
    
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

    // 等待页面加载完成
    await page.waitForTimeout(10000);

    // 保存页面截图
    const initialScreenshot = `douyin-publish-initial-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    console.log(`${currentTime} - 初始页面截图已保存: ${initialScreenshot}`);

    // 获取页面可见文本检查是否有发布相关内容
    const visibleText = await page.textContent('body');
    console.log(`${currentTime} - 页面可见文本前500字符: ${visibleText.substring(0, 500)}`);

    // 查找输入框的可能位置
    console.log(`${currentTime} - 查找输入框和按钮`);
    
    // 尝试使用多种方式查找标题输入框
    const titleSelectors = [
      'input[placeholder*="标题"]',
      'input[placeholder*="标题"]',
      '[data-placeholder*="标题"]',
      '.title-input',
      'input[name*="title"]'
    ];

    let titleInput;
    for (const selector of titleSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          titleInput = elements[0];
          console.log(`${currentTime} - 标题输入框找到，使用选择器: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (titleInput) {
      await titleInput.fill('测试标题');
      await page.waitForTimeout(1000);
      console.log(`${currentTime} - 标题已填写`);
    } else {
      console.log(`${currentTime} - 未找到标题输入框`);
    }

    // 查找内容输入框的各种方式
    const contentSelectors = [
      'textarea[placeholder*="内容"]',
      'div[contenteditable="true"]',
      '.content-input',
      '.editor',
      '[data-placeholder*="内容"]'
    ];

    let contentInput;
    for (const selector of contentSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          contentInput = elements[0];
          console.log(`${currentTime} - 内容输入框找到，使用选择器: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (contentInput) {
      // 根据输入框类型进行不同的操作
      const tagName = await contentInput.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'textarea') {
        await contentInput.fill('这是测试内容，用于验证抖音自动化发布');
      } else if (tagName === 'div' && await contentInput.evaluate(el => el.hasAttribute('contenteditable'))) {
        await contentInput.focus();
        await page.keyboard.type('这是测试内容，用于验证抖音自动化发布');
      } else {
        console.log(`${currentTime} - 未知的内容输入框类型: ${tagName}`);
      }
      
      await page.waitForTimeout(1000);
      console.log(`${currentTime} - 内容已填写`);
    } else {
      console.log(`${currentTime} - 未找到内容输入框`);
    }

    // 查找发布按钮
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
        await page.waitForTimeout(5000);
        
        // 保存发布后截图
        const publishScreenshot = `douyin-publish-result-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: publishScreenshot, fullPage: true });
        console.log(`${currentTime} - 发布后截图已保存: ${publishScreenshot}`);
        
        // 检查是否有成功提示
        const successText = await page.textContent('body');
        if (successText.includes('发布成功') || successText.includes('已发布')) {
          console.log(`${currentTime} - 文章发布成功`);
        } else if (successText.includes('审核') || successText.includes('待审核')) {
          console.log(`${currentTime} - 文章已提交，正在审核中`);
        } else {
          console.log(`${currentTime} - 发布操作已执行，但未找到成功提示`);
        }
      } else {
        console.log(`${currentTime} - 发布按钮不可点击`);
      }
    } else {
      console.log(`${currentTime} - 未找到发布按钮`);
    }

    // 保存最终状态截图
    const finalScreenshot = `douyin-publish-final-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`${currentTime} - 最终页面截图已保存: ${finalScreenshot}`);

    await browser.close();
    console.log(`${currentTime} - 任务完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
  }
}

optimizedDouyinPublish().catch(error => console.error('任务失败:', error));
