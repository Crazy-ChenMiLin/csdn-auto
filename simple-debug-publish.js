const { chromium } = require('playwright');
const fs = require('fs');

async function simpleDebugPublish() {
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
    console.log(`${currentTime} - 开始简单调试发布`);
    
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

    await page.waitForTimeout(5000);

    // 保存初始页面截图
    const initialScreenshot = `debug-initial-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    console.log(`${currentTime} - 初始页面截图已保存: ${initialScreenshot}`);

    // 获取所有输入框和按钮
    const allInputs = await page.$$eval('input, button, textarea, [contenteditable="true"]', elements => 
      elements.map(el => {
        const tagName = el.tagName.toLowerCase();
        const placeholder = el.getAttribute('placeholder');
        const text = el.textContent?.trim();
        const disabled = el.disabled;
        const style = el.getAttribute('style');
        
        return {
          tagName,
          placeholder: placeholder || '',
          text: text || '',
          disabled,
          style: style || '',
          id: el.getAttribute('id') || '',
          className: el.getAttribute('class') || ''
        };
      })
    );

    console.log(`${currentTime} - 页面上找到的输入和按钮元素:`);
    allInputs.forEach(el => {
      if (el.text || el.placeholder) {
        console.log(`  - ${el.tagName} ${el.id || el.className || ''}: ${el.disabled ? '(禁用)' : ''} ${el.text || el.placeholder}`);
      }
    });

    // 查找图片上传区域
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      const imagePath = '/home/node/.openclaw/workspace/playwright-example.png';
      if (fs.existsSync(imagePath)) {
        console.log(`${currentTime} - 找到文件输入框，上传示例图片`);
        await fileInput.setInputFiles(imagePath);
        await page.waitForTimeout(3000);
        
        const uploadedScreenshot = `debug-uploaded-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: uploadedScreenshot, fullPage: true });
        console.log(`${currentTime} - 图片上传后截图已保存: ${uploadedScreenshot}`);
      }
    } else {
      console.log(`${currentTime} - 未找到文件输入框`);
    }

    // 查找并点击高清发布按钮
    const publishBtn = await page.$('button:has-text("高清发布")');
    if (publishBtn) {
      const isDisabled = await publishBtn.evaluate(el => el.disabled);
      
      if (!isDisabled) {
        console.log(`${currentTime} - 找到"高清发布"按钮，可点击`);
        
        // 点击按钮并观察页面变化
        await Promise.all([
          publishBtn.click(),
          page.waitForNavigation({ timeout: 10000 }).catch(error => {
            console.log(`${currentTime} - 页面没有导航，可能是异步操作: ${error.message}`);
          })
        ]);
        
        await page.waitForTimeout(5000);
        
        const publishScreenshot = `debug-published-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: publishScreenshot, fullPage: true });
        console.log(`${currentTime} - 发布后截图已保存: ${publishScreenshot}`);
        
        // 检查页面是否有任何反馈
        const pageContent = await page.content();
        if (pageContent.includes('发布成功') || pageContent.includes('待审核') || pageContent.includes('已发布')) {
          console.log(`${currentTime} - 找到成功提示`);
        } else if (pageContent.includes('错误') || pageContent.includes('失败')) {
          console.log(`${currentTime} - 找到错误提示`);
        } else {
          console.log(`${currentTime} - 未找到明确的反馈信息`);
        }
        
        // 保存最终页面HTML
        fs.writeFileSync(`debug-final-page-${currentTime.replace(/[:.]/g, '-')}.html`, pageContent);
      } else {
        console.log(`${currentTime} - "高清发布"按钮已禁用`);
      }
    } else {
      console.log(`${currentTime} - 未找到"高清发布"按钮`);
    }

    await browser.close();
    console.log(`${currentTime} - 简单调试发布完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `debug-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

simpleDebugPublish().catch(error => console.error('简单调试发布失败:', error));
