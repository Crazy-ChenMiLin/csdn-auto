const { chromium } = require('playwright');
const fs = require('fs');

async function checkMediaType() {
  const testUrls = [
    'https://creator.douyin.com/creator-micro/content/post/image-text?enter_from=publish_page&media_type=image&type=new',
    'https://creator.douyin.com/creator-micro/content/post/image-text?enter_from=publish_page&media_type=photo&type=new',
    'https://creator.douyin.com/creator-micro/content/post/video?enter_from=publish_page&media_type=video&type=new',
    'https://creator.douyin.com/creator-micro/content/post?enter_from=publish_page&media_type=image&type=new'
  ];

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

  let browser, context;

  try {
    console.log('开始检查不同的媒体类型页面');
    
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

    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i];
      console.log(`\n测试URL ${i + 1}: ${url}`);

      const page = await context.newPage();

      try {
        const response = await page.goto(url, {
          timeout: 60000,
          waitUntil: 'networkidle'
        });

        console.log(`访问成功，状态码: ${response?.status() || '无响应'}`);

        await page.waitForTimeout(3000);

        // 检查页面上的可见文本
        const pageText = await page.textContent('body');
        
        // 检查是否有图片或视频相关的文本
        const hasImage = pageText.includes('图片') || pageText.includes('photo');
        const hasVideo = pageText.includes('视频') || pageText.includes('video');
        
        console.log(`图片相关文本: ${hasImage}`);
        console.log(`视频相关文本: ${hasVideo}`);

        // 检查文件输入框的accept属性
        const fileInputs = await page.$$('input[type="file"]');
        console.log(`找到 ${fileInputs.length} 个文件输入框`);
        
        for (let j = 0; j < fileInputs.length; j++) {
          const accept = await fileInputs[j].getAttribute('accept');
          console.log(`文件输入框 ${j} 接受的类型: ${accept}`);
        }

        // 检查按钮文本
        const buttons = await page.$$('button');
        console.log(`找到 ${buttons.length} 个按钮`);
        
        for (let j = 0; j < buttons.length; j++) {
          const buttonText = await buttons[j].textContent();
          if (buttonText.trim()) {
            console.log(`按钮 ${j}: ${buttonText.trim()}`);
          }
        }

        // 保存截图
        const screenshotPath = `media-type-test-${i + 1}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`截图已保存: ${screenshotPath}`);

        // 保存页面HTML
        const htmlPath = `media-type-test-${i + 1}-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
        const pageHTML = await page.content();
        fs.writeFileSync(htmlPath, pageHTML);
        console.log(`页面HTML已保存: ${htmlPath}`);

      } catch (error) {
        console.error(`访问URL失败: ${error.message}`);
      } finally {
        await page.close();
      }
    }

    await browser.close();
    console.log('\n所有URL测试完成');

  } catch (error) {
    console.error(`任务失败: ${error.message}`);
    if (browser) {
      await browser.close();
    }
  }
}

checkMediaType().catch(error => console.error('检查媒体类型失败:', error));
