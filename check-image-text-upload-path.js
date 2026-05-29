const { chromium } = require('playwright');
const fs = require('fs');

async function checkImageTextUploadPath() {
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
    console.log(`${currentTime} - 开始检查图文发布页面的上传路径`);
    
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

    await page.waitForTimeout(3000);

    // 检查页面上是否有图片上传相关的元素
    console.log('=== 检查图片上传相关元素 ===');
    const imageUploadElements = await page.$$('input[type="file"], .image-upload, .upload-image, button:has-text("图片")');
    console.log(`找到 ${imageUploadElements.length} 个图片上传相关元素`);
    
    for (let i = 0; i < imageUploadElements.length; i++) {
      const element = imageUploadElements[i];
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const text = await element.textContent();
      const classes = await element.evaluate(el => el.className);
      
      if (tagName === 'input') {
        const type = await element.evaluate(el => el.type);
        const accept = await element.evaluate(el => el.accept);
        console.log(`元素 ${i}: 输入框, 类型=${type}, 接受=${accept}, 类名=${classes}`);
      } else if (tagName === 'button') {
        console.log(`元素 ${i}: 按钮, 文本="${text.trim()}", 类名=${classes}`);
      } else {
        console.log(`元素 ${i}: 其他, 文本="${text.trim().slice(0, 100)}...", 类名=${classes}`);
      }
    }

    // 查找并点击"发布图文"选项（如果有）
    const publishImageTextButton = await page.$('button:has-text("发布图文"), button[title*="图文"]');
    if (publishImageTextButton) {
      console.log('\n找到"发布图文"按钮，点击以进入图片上传页面');
      await publishImageTextButton.click();
      
      await page.waitForTimeout(3000);
      
      // 检查是否有新页面加载
      if (page.url() !== targetUrl) {
        console.log(`页面导航到: ${page.url()}`);
      }
      
      const afterClickScreenshot = `image-text-page-after-click-${currentTime.replace(/[:.]/g, '-')}.png`;
      await page.screenshot({ path: afterClickScreenshot, fullPage: true });
      console.log(`点击后截图已保存: ${afterClickScreenshot}`);
    }

    // 检查页面上的所有链接
    console.log('\n=== 检查页面上的链接 ===');
    const links = await page.$$('a[href]');
    console.log(`找到 ${links.length} 个链接`);
    
    for (let i = 0; i < links.length; i++) {
      const href = await links[i].getAttribute('href');
      const text = await links[i].textContent();
      
      if (href && (href.includes('image') || href.includes('photo') || href.includes('upload'))) {
        console.log(`链接 ${i}: ${text.trim()} -> ${href}`);
      }
    }

    // 找到"高清发布"按钮
    const publishButton = await page.$('button:has-text("高清发布")');
    if (publishButton) {
      console.log('\n找到"高清发布"按钮');
      
      // 检查按钮是否可见和启用
      const isVisible = await publishButton.isVisible();
      const isEnabled = await publishButton.isEnabled();
      
      console.log(`按钮状态: 可见=${isVisible}, 启用=${isEnabled}`);
      
      if (isVisible) {
        const rect = await publishButton.boundingBox();
        console.log(`按钮位置: ${rect.x}, ${rect.y}, ${rect.width}x${rect.height}`);
        
        // 检查按钮的属性
        const classes = await publishButton.evaluate(el => el.className);
        console.log(`按钮类名: ${classes}`);
      }
    }

    // 保存页面HTML
    const pageHTML = await page.content();
    const htmlPath = `image-text-page-html-${currentTime.replace(/[:.]/g, '-')}.html`;
    fs.writeFileSync(htmlPath, pageHTML);
    console.log(`\n页面HTML已保存到: ${htmlPath}`);

    // 保存截图
    const screenshotPath = `image-text-page-full-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`页面截图已保存到: ${screenshotPath}`);

    await browser.close();
    console.log('\n检查完成');

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `check-image-text-upload-path-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

checkImageTextUploadPath().catch(error => console.error('检查图文上传路径失败:', error));
