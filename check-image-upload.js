const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function checkImageUpload() {
  const targetUrl = 'https://creator.douyin.com/creator-micro/content/upload';
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
  const networkEvents = [];

  try {
    console.log(`${currentTime} - 开始检查图片上传过程`);
    
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

    // 监控网络请求
    page.on('request', (request) => {
      const requestData = {
        type: 'request',
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      };
      
      if (request.url().includes('upload') || request.url().includes('resource')) {
        console.log(`${currentTime} - 请求: ${request.method()} ${request.url()}`);
        networkEvents.push(requestData);
      }
    });

    page.on('response', (response) => {
      const responseData = {
        type: 'response',
        status: response.status(),
        url: response.url(),
        timestamp: new Date().toISOString()
      };
      
      if (response.url().includes('upload') || response.url().includes('resource')) {
        console.log(`${currentTime} - 响应: ${response.status()} ${response.url()}`);
        networkEvents.push(responseData);
      }
    });

    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(3000);

    // 找到文件输入框
    const fileInputs = await page.$$('input[type="file"]');
    console.log(`${currentTime} - 找到 ${fileInputs.length} 个文件输入框`);
    
    if (fileInputs.length > 0) {
      for (let i = 0; i < fileInputs.length; i++) {
        const fileInput = fileInputs[i];
        
        // 检查文件输入框是否可见
        const isVisible = await fileInput.isVisible();
        // 检查是否启用
        const isEnabled = await fileInput.isEnabled();
        // 检查类型
        const type = await fileInput.getAttribute('type');
        // 检查是否有accept属性
        const accept = await fileInput.getAttribute('accept');
        
        console.log(`${currentTime} - 文件输入框 ${i}: 可见=${isVisible}, 启用=${isEnabled}, 类型=${type}, 接受=${accept}`);
        
        if (isVisible && isEnabled) {
          // 尝试上传图片
          const imagePath = path.resolve(__dirname, 'playwright-example.png');
          console.log(`${currentTime} - 尝试上传图片: ${imagePath}`);
          
          await fileInput.setInputFiles(imagePath);
          
          console.log(`${currentTime} - 文件输入已设置`);
          
          await page.waitForTimeout(8000); // 等待更长时间让上传完成
          
          const afterUploadScreenshot = `check-image-upload-after-upload-${i}-${currentTime.replace(/[:.]/g, '-')}.png`;
          await page.screenshot({ path: afterUploadScreenshot, fullPage: true });
          console.log(`${currentTime} - 上传后截图已保存: ${afterUploadScreenshot}`);
          
          // 检查是否有图片预览元素
          const imagePreviews = await page.$$('img[src*="blob:"], img[src*="upload"], .image-preview');
          console.log(`${currentTime} - 找到 ${imagePreviews.length} 个图片预览元素`);
          
          for (let j = 0; j < imagePreviews.length; j++) {
            const preview = imagePreviews[j];
            const src = await preview.getAttribute('src');
            const isVisible = await preview.isVisible();
            
            console.log(`${currentTime} - 图片预览 ${j}: src=${src}, 可见=${isVisible}`);
            
            if (isVisible) {
              // 截图预览区域
              const previewRect = await preview.boundingBox();
              if (previewRect) {
                const previewScreenshot = `check-image-upload-preview-${j}-${currentTime.replace(/[:.]/g, '-')}.png`;
                await page.screenshot({ 
                  path: previewScreenshot, 
                  clip: { 
                    x: previewRect.x, 
                    y: previewRect.y, 
                    width: previewRect.width, 
                    height: previewRect.height 
                  } 
                });
                console.log(`${currentTime} - 图片预览截图已保存: ${previewScreenshot}`);
              }
            }
          }
        }
      }
    } else {
      console.log(`${currentTime} - 未找到可见的文件输入框，检查是否有上传按钮`);
      
      const uploadButtons = await page.$$('button:has-text("上传")');
      console.log(`${currentTime} - 找到 ${uploadButtons.length} 个上传按钮`);
      
      for (let i = 0; i < uploadButtons.length; i++) {
        const uploadButton = uploadButtons[i];
        
        console.log(`${currentTime} - 点击上传按钮 ${i}`);
        await uploadButton.click();
        
        await page.waitForTimeout(3000);
        
        // 再次查找文件输入框
        const newFileInputs = await page.$$('input[type="file"]');
        console.log(`${currentTime} - 点击后找到 ${newFileInputs.length} 个文件输入框`);
        
        if (newFileInputs.length > fileInputs.length) {
          for (let j = fileInputs.length; j < newFileInputs.length; j++) {
            const newFileInput = newFileInputs[j];
            const isVisible = await newFileInput.isVisible();
            const isEnabled = await newFileInput.isEnabled();
            
            if (isVisible && isEnabled) {
              const imagePath = path.resolve(__dirname, 'playwright-example.png');
              console.log(`${currentTime} - 上传图片: ${imagePath}`);
              
              await newFileInput.setInputFiles(imagePath);
              
              await page.waitForTimeout(8000);
              
              const afterClickUploadScreenshot = `check-image-upload-click-upload-${j}-${currentTime.replace(/[:.]/g, '-')}.png`;
              await page.screenshot({ path: afterClickUploadScreenshot, fullPage: true });
              console.log(`${currentTime} - 上传后截图已保存: ${afterClickUploadScreenshot}`);
              
              break;
            }
          }
          break;
        }
      }
    }

    // 保存网络事件
    const networkEventsPath = `check-image-upload-network-events-${currentTime.replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(networkEventsPath, JSON.stringify(networkEvents, null, 2));
    console.log(`${currentTime} - 网络事件已保存到: ${networkEventsPath}`);

    await browser.close();
    console.log(`${currentTime} - 图片上传检查完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `check-image-upload-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

checkImageUpload().catch(error => console.error('检查图片上传失败:', error));
