const { chromium } = require('playwright');
const fs = require('fs');

async function checkRequiredFields() {
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
    console.log(`${currentTime} - 开始检查必填字段`);
    
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

    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(5000);

    // 检查页面上所有输入框、文本区域、必填字段
    const inputs = await page.$$('input, textarea');
    console.log(`${currentTime} - 找到 ${inputs.length} 个输入框/文本区域`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const tagName = await input.evaluate(el => el.tagName);
      const type = await input.evaluate(el => el.type);
      const placeholder = await input.evaluate(el => el.placeholder || '');
      const required = await input.evaluate(el => el.hasAttribute('required') || el.getAttribute('aria-required') === 'true');
      const disabled = await input.evaluate(el => el.disabled);
      
      console.log(`${currentTime} - ${tagName}[${i}]: 类型=${type}, 占位符="${placeholder}", 必填=${required}, 禁用=${disabled}`);
    }

    // 检查所有按钮
    const buttons = await page.$$('button');
    console.log(`${currentTime} - 找到 ${buttons.length} 个按钮`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const disabled = await button.evaluate(el => el.disabled);
      const className = await button.evaluate(el => el.className);
      
      console.log(`${currentTime} - 按钮[${i}]: 文本="${text.trim()}", 禁用=${disabled}, 类名="${className}"`);
    }

    // 检查是否有标题、描述等字段
    const titleInputs = await page.$$('input[placeholder*="标题"], input[placeholder*="Title"], [data-placeholder*="标题"]');
    const descInputs = await page.$$('textarea[placeholder*="描述"], textarea[placeholder*="Description"], [data-placeholder*="描述"]');
    
    console.log(`${currentTime} - 标题字段数量: ${titleInputs.length}`);
    console.log(`${currentTime} - 描述字段数量: ${descInputs.length}`);

    const initialScreenshot = `required-fields-initial-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    console.log(`${currentTime} - 页面截图已保存: ${initialScreenshot}`);

    // 尝试填写标题和描述
    if (titleInputs.length > 0) {
      console.log(`${currentTime} - 填写标题字段`);
      await titleInputs[0].fill(`测试标题 ${currentTime}`);
    }

    if (descInputs.length > 0) {
      console.log(`${currentTime} - 填写描述字段`);
      await descInputs[0].fill(`这是一个测试描述，用于验证图文发布功能。${currentTime}`);
    }

    await page.waitForTimeout(3000);

    // 上传图片
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      const imagePath = '/home/node/.openclaw/workspace/playwright-example.png';
      if (fs.existsSync(imagePath)) {
        console.log(`${currentTime} - 找到文件输入框，上传示例图片`);
        await fileInput.setInputFiles(imagePath);
        await page.waitForTimeout(5000);
      }
    }

    const afterFillScreenshot = `required-fields-filled-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: afterFillScreenshot, fullPage: true });
    console.log(`${currentTime} - 填写和上传后截图已保存: ${afterFillScreenshot}`);

    // 检查发布按钮状态
    const publishBtn = await page.$('button:has-text("高清发布")');
    if (publishBtn) {
      const isDisabled = await publishBtn.evaluate(el => el.disabled);
      const ariaDisabled = await publishBtn.evaluate(el => el.getAttribute('aria-disabled'));
      
      console.log(`${currentTime} - "高清发布"按钮状态: 禁用=${isDisabled}, aria-disabled=${ariaDisabled}`);
      
      if (!isDisabled) {
        console.log(`${currentTime} - 尝试点击发布按钮`);
        await publishBtn.click();
        await page.waitForTimeout(5000);
        
        const publishScreenshot = `required-fields-published-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: publishScreenshot, fullPage: true });
        console.log(`${currentTime} - 点击发布后截图已保存: ${publishScreenshot}`);
        
        // 检查是否有成功提示
        const pageContent = await page.content();
        if (pageContent.includes('发布成功') || pageContent.includes('待审核') || pageContent.includes('已发布')) {
          console.log(`${currentTime} - 找到成功提示`);
        } else if (pageContent.includes('错误') || pageContent.includes('失败') || pageContent.includes('必填')) {
          console.log(`${currentTime} - 找到错误或必填提示`);
        } else {
          console.log(`${currentTime} - 未找到明确的反馈信息`);
        }
      }
    }

    await browser.close();
    console.log(`${currentTime} - 检查完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `required-fields-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

checkRequiredFields().catch(error => console.error('检查必填字段失败:', error));
