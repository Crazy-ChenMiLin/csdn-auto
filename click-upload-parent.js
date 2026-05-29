const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function clickUploadParent() {
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
    console.log(`${currentTime} - 开始点击上传父元素`);
    
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

    // 找到接受图片的文件输入框的父元素
    const pictureFileInputs = await page.$$('input[type="file"][accept*="image"]');
    console.log(`${currentTime} - 找到 ${pictureFileInputs.length} 个接受图片的文件输入框`);
    
    if (pictureFileInputs.length > 0) {
      const pictureFileInput = pictureFileInputs[0];
      
      // 获取父元素
      const parentElement = await pictureFileInput.evaluate(el => el.parentElement);
      const parentHandle = await page.evaluateHandle(el => el, parentElement);
      
      // 检查父元素是否可见和可点击
      const isVisible = await parentHandle.isVisible();
      const isEnabled = await parentHandle.isEnabled();
      
      console.log(`${currentTime} - 父元素可见: ${isVisible}, 可点击: ${isEnabled}`);
      
      if (isVisible && isEnabled) {
        // 点击父元素
        console.log(`${currentTime} - 点击父元素`);
        await parentHandle.click();
        
        await page.waitForTimeout(2000);
        
        const afterClickScreenshot = `click-upload-parent-after-click-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: afterClickScreenshot, fullPage: true });
        console.log(`${currentTime} - 点击后截图已保存: ${afterClickScreenshot}`);
        
        // 尝试直接给隐藏的文件输入框设置文件
        const imagePath = path.resolve(__dirname, 'playwright-example.png');
        console.log(`${currentTime} - 图片路径: ${imagePath}`);
        
        try {
          await pictureFileInput.setInputFiles(imagePath);
          console.log(`${currentTime} - 图片已设置到输入框`);
          
          await page.waitForTimeout(5000); // 等待上传完成
          
          const afterSetFileScreenshot = `click-upload-parent-after-set-file-${currentTime.replace(/[:.]/g, '-')}.png`;
          await page.screenshot({ path: afterSetFileScreenshot, fullPage: true });
          console.log(`${currentTime} - 设置文件后截图已保存: ${afterSetFileScreenshot}`);
          
          // 检查是否有图片预览
          const imagePreviews = await page.$$('img[src*="blob:"], img[src*="upload"], .image-preview img');
          console.log(`${currentTime} - 找到 ${imagePreviews.length} 个图片预览`);
          
          if (imagePreviews.length > 0) {
            console.log(`${currentTime} - 图片已成功上传并显示预览`);
            
            // 保存预览截图
            const previewScreenshot = `click-upload-parent-preview-${currentTime.replace(/[:.]/g, '-')}.png`;
            await imagePreviews[0].screenshot({ path: previewScreenshot });
            console.log(`${currentTime} - 预览截图已保存: ${previewScreenshot}`);
          }
          
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
          const publishButton = await page.$('button:has-text("高清发布")');
          if (publishButton) {
            const isPublishEnabled = await publishButton.isEnabled();
            console.log(`${currentTime} - 发布按钮是否可点击: ${isPublishEnabled}`);
            
            if (isPublishEnabled) {
              await publishButton.click();
              console.log(`${currentTime} - 发布按钮已点击`);
              
              await page.waitForTimeout(5000);
              
              const afterPublishScreenshot = `click-upload-parent-after-publish-${currentTime.replace(/[:.]/g, '-')}.png`;
              await page.screenshot({ path: afterPublishScreenshot, fullPage: true });
              console.log(`${currentTime} - 发布后截图已保存: ${afterPublishScreenshot}`);
              
              // 检查是否有成功提示
              const pageContent = await page.textContent('body');
              if (pageContent.includes('发布成功') || pageContent.includes('待审核')) {
                console.log(`${currentTime} - 找到成功/待审核提示`);
              }
            }
          }
          
        } catch (error) {
          console.error(`${currentTime} - 无法设置文件: ${error.message}`);
        }
      } else {
        console.log(`${currentTime} - 父元素不可见或不可点击`);
      }
    } else {
      console.log(`${currentTime} - 未找到接受图片的文件输入框`);
    }

    await browser.close();
    console.log(`${currentTime} - 测试完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `click-upload-parent-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

clickUploadParent().catch(error => console.error('点击上传父元素失败:', error));
