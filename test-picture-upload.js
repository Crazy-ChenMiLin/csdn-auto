const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testPictureUpload() {
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
    console.log(`${currentTime} - 开始测试图片上传`);
    
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

    // 找到接受图片的文件输入框
    console.log(`${currentTime} - 查找接受图片的文件输入框`);
    const fileInputs = await page.$$('input[type="file"]');
    let pictureInput = null;
    
    for (let i = 0; i < fileInputs.length; i++) {
      const accept = await fileInputs[i].getAttribute('accept');
      console.log(`${currentTime} - 文件输入框 ${i} 接受的类型: ${accept}`);
      
      if (accept && (accept.includes('image') || accept.includes('png') || accept.includes('jpeg'))) {
        pictureInput = fileInputs[i];
        console.log(`${currentTime} - 找到接受图片的文件输入框: ${i}`);
        break;
      }
    }

    if (pictureInput) {
      // 检查文件输入框是否可见和启用
      const isVisible = await pictureInput.isVisible();
      const isEnabled = await pictureInput.isEnabled();
      
      if (isVisible && isEnabled) {
        const imagePath = path.resolve(__dirname, 'playwright-example.png');
        console.log(`${currentTime} - 图片路径: ${imagePath}`);
        
        // 上传图片
        await pictureInput.setInputFiles(imagePath);
        console.log(`${currentTime} - 图片已上传`);
        
        await page.waitForTimeout(5000); // 等待上传完成
        
        const afterUploadScreenshot = `test-picture-upload-after-upload-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: afterUploadScreenshot, fullPage: true });
        console.log(`${currentTime} - 上传后截图已保存: ${afterUploadScreenshot}`);
        
        // 填写标题和描述
        const titleInput = await page.$('input[name*="title"], input[placeholder*="标题"]');
        if (titleInput) {
          await titleInput.fill('测试图片上传');
          console.log(`${currentTime} - 标题已填写`);
        }

        const descriptionInput = await page.$('textarea[name*="description"], textarea[placeholder*="描述"], .editor-content');
        if (descriptionInput) {
          await descriptionInput.fill('这是一个通过Playwright自动化上传和发布的测试图片');
          console.log(`${currentTime} - 描述已填写`);
        }

        await page.waitForTimeout(3000);
        
        // 找到发布按钮
        const publishButtons = await page.$$('button:has-text("高清发布"), button:has-text("发布")');
        console.log(`${currentTime} - 找到 ${publishButtons.length} 个发布按钮`);
        
        for (let i = 0; i < publishButtons.length; i++) {
          const publishButton = publishButtons[i];
          const buttonText = await publishButton.textContent();
          const isEnabled = await publishButton.isEnabled();
          
          if (isEnabled) {
            console.log(`${currentTime} - 点击发布按钮: ${buttonText.trim()}`);
            
            await Promise.all([
              publishButton.click(),
              page.waitForNavigation({ timeout: 10000 }).catch(error => {
                console.log(`${currentTime} - 页面没有导航，可能是异步操作: ${error.message}`);
              })
            ]);
            
            await page.waitForTimeout(5000);
            
            const afterPublishScreenshot = `test-picture-upload-after-publish-${currentTime.replace(/[:.]/g, '-')}.png`;
            await page.screenshot({ path: afterPublishScreenshot, fullPage: true });
            console.log(`${currentTime} - 发布后截图已保存: ${afterPublishScreenshot}`);
            
            // 检查是否有成功提示
            const pageContent = await page.textContent('body');
            if (pageContent.includes('发布成功') || pageContent.includes('待审核')) {
              console.log(`${currentTime} - 找到成功/待审核提示: ${pageContent.includes('发布成功') ? '发布成功' : '待审核'}`);
              
              const successScreenshot = `test-picture-upload-success-${currentTime.replace(/[:.]/g, '-')}.png`;
              await page.screenshot({ path: successScreenshot, fullPage: true });
              console.log(`${currentTime} - 成功截图已保存: ${successScreenshot}`);
              
              break;
            }
          }
        }
      } else {
        console.log(`${currentTime} - 文件输入框不可见或不可启用`);
      }
    } else {
      console.log(`${currentTime} - 未找到接受图片的文件输入框`);
    }

    await browser.close();
    console.log(`${currentTime} - 测试完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `test-picture-upload-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

testPictureUpload().catch(error => console.error('测试图片上传失败:', error));
