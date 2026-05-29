const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testPictureInput() {
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
    console.log(`${currentTime} - 开始测试图片格式的文件输入框`);
    
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
      waitUntil: 'domcontentloaded'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(2000);

    // 找到接受图片格式的文件输入框
    const pictureInputs = await page.$$('input[type="file"][accept*="image"]');
    console.log(`${currentTime} - 找到 ${pictureInputs.length} 个接受图片格式的文件输入框`);
    
    if (pictureInputs.length > 0) {
      const pictureInput = pictureInputs[0];
      
      // 检查输入框是否可见
      const isVisible = await pictureInput.isVisible();
      const isEnabled = await pictureInput.isEnabled();
      
      console.log(`${currentTime} - 输入框状态: 可见=${isVisible}, 启用=${isEnabled}`);
      
      // 获取输入框的accept属性
      const acceptValue = await pictureInput.getAttribute('accept');
      console.log(`${currentTime} - 接受的文件类型: ${acceptValue}`);
      
      // 上传图片
      const imagePath = path.resolve(__dirname, 'playwright-example.png');
      console.log(`${currentTime} - 图片路径: ${imagePath}`);
      
      await pictureInput.setInputFiles(imagePath);
      console.log(`${currentTime} - 图片已成功上传到输入框`);
      
      await page.waitForTimeout(4000);
      
      // 截图
      const afterUploadScreenshot = `test-picture-input-after-upload-${currentTime.replace(/[:.]/g, '-')}.png`;
      await page.screenshot({ path: afterUploadScreenshot, fullPage: true });
      console.log(`${currentTime} - 上传后截图已保存: ${afterUploadScreenshot}`);
      
      // 找到发布按钮
      const publishButton = await page.$('button:has-text("发布")');
      if (publishButton) {
        const publishIsVisible = await publishButton.isVisible();
        const publishIsEnabled = await publishButton.isEnabled();
        
        console.log(`${currentTime} - 发布按钮状态: 可见=${publishIsVisible}, 启用=${publishIsEnabled}`);
        
        if (publishIsVisible && publishIsEnabled) {
          await publishButton.click();
          console.log(`${currentTime} - 发布按钮已点击`);
          
          await page.waitForTimeout(5000);
          
          const afterPublishScreenshot = `test-picture-input-after-publish-${currentTime.replace(/[:.]/g, '-')}.png`;
          await page.screenshot({ path: afterPublishScreenshot, fullPage: true });
          console.log(`${currentTime} - 发布后截图已保存: ${afterPublishScreenshot}`);
          
          // 检查是否有成功提示
          const pageContent = await page.textContent('body');
          if (pageContent.includes('发布成功') || pageContent.includes('待审核') || pageContent.includes('已发布')) {
            console.log(`${currentTime} - 检测到成功提示: ${pageContent.includes('发布成功') ? '发布成功' : pageContent.includes('待审核') ? '待审核' : '已发布'}`);
          } else if (pageContent.includes('错误') || pageContent.includes('失败') || pageContent.includes('请')) {
            console.log(`${currentTime} - 检测到错误或提示信息`);
            
            // 查找错误信息
            const errorElements = await page.$$('.error, .warning, .tips, [class*="error"], [class*="warning"], [class*="tips"]');
            console.log(`${currentTime} - 找到 ${errorElements.length} 个可能的提示元素`);
            
            for (let i = 0; i < errorElements.length; i++) {
              const text = await errorElements[i].textContent();
              if (text.trim()) {
                console.log(`${currentTime} - 提示 ${i + 1}: ${text.trim()}`);
              }
            }
          } else {
            console.log(`${currentTime} - 未检测到明确的成功或失败提示`);
          }
        } else {
          console.log(`${currentTime} - 发布按钮不可见或不可启用`);
          
          // 检查是否有其他禁用原因的提示
          const disabledElements = await page.$$('[disabled], [class*="disabled"], .ant-form-item-has-error');
          console.log(`${currentTime} - 找到 ${disabledElements.length} 个可能的禁用原因元素`);
          
          for (let i = 0; i < disabledElements.length; i++) {
            const text = await disabledElements[i].textContent();
            if (text.trim()) {
              console.log(`${currentTime} - 禁用元素 ${i + 1}: ${text.trim()}`);
            }
          }
        }
      } else {
        console.log(`${currentTime} - 未找到"发布"按钮`);
        
        // 查找页面上所有按钮
        const allButtons = await page.$$('button');
        console.log(`${currentTime} - 页面上有 ${allButtons.length} 个按钮`);
        
        for (let i = 0; i < allButtons.length; i++) {
          const text = await allButtons[i].textContent();
          if (text.trim()) {
            console.log(`${currentTime} - 按钮 ${i + 1}: "${text.trim()}"`);
          }
        }
      }
      
    } else {
      console.log(`${currentTime} - 未找到接受图片格式的文件输入框`);
      
      // 查找所有文件输入框
      const allFileInputs = await page.$$('input[type="file"]');
      console.log(`${currentTime} - 页面上有 ${allFileInputs.length} 个文件输入框`);
      
      for (let i = 0; i < allFileInputs.length; i++) {
        const acceptValue = await allFileInputs[i].getAttribute('accept');
        console.log(`${currentTime} - 文件输入框 ${i + 1} 接受的类型: ${acceptValue}`);
      }
    }
    
    await browser.close();
    console.log(`${currentTime} - 测试完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `test-picture-input-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

testPictureInput().catch(error => console.error('测试图片输入框失败:', error));
