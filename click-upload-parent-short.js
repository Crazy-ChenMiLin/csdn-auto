const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function clickUploadParentShort() {
  const targetUrl = 'https://creator.douyin.com/creator-micro/content/post/video?enter_from=publish_page&media_type=video&type=new';
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
    console.log(`${currentTime} - 开始点击上传父元素（短超时）`);
    
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
      timeout: 30000,
      waitUntil: 'domcontentloaded' // 只等待DOM加载完成
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(2000); // 等待2秒

    // 找到接受图片的文件输入框
    const pictureFileInputs = await page.$$('input[type="file"][accept*="image"]');
    console.log(`${currentTime} - 找到 ${pictureFileInputs.length} 个接受图片的文件输入框`);
    
    if (pictureFileInputs.length > 0) {
      const pictureFileInput = pictureFileInputs[0];
      
      // 找到父元素
      const parentElement = await pictureFileInput.evaluateHandle(el => el.parentElement);
      
      // 尝试点击父元素
      await parentElement.click().catch(error => {
        console.error(`${currentTime} - 点击父元素失败: ${error.message}`);
      });
      
      await page.waitForTimeout(1000);
      
      // 尝试直接设置文件
      const imagePath = path.resolve(__dirname, 'playwright-example.png');
      console.log(`${currentTime} - 图片路径: ${imagePath}`);
      
      try {
        await pictureFileInput.setInputFiles(imagePath);
        console.log(`${currentTime} - 图片已设置`);
        
        await page.waitForTimeout(3000);
        
        const screenshotPath = `click-upload-parent-short-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`${currentTime} - 截图已保存: ${screenshotPath}`);
        
      } catch (error) {
        console.error(`${currentTime} - 设置文件失败: ${error.message}`);
      }
    }

    await browser.close();
    console.log(`${currentTime} - 测试完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `click-upload-parent-short-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

clickUploadParentShort().catch(error => console.error('点击上传父元素（短超时）失败:', error));
