const { chromium } = require('playwright');
const fs = require('fs');

async function findUploadTrigger() {
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
    console.log(`${currentTime} - 开始寻找图片上传的触发方式`);
    
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

    // 找到所有接受图片的文件输入框
    const fileInputs = await page.$$('input[type="file"]');
    console.log(`${currentTime} - 找到 ${fileInputs.length} 个文件输入框`);
    
    for (let i = 0; i < fileInputs.length; i++) {
      const fileInput = fileInputs[i];
      const accept = await fileInput.getAttribute('accept');
      const type = await fileInput.getAttribute('type');
      const id = await fileInput.getAttribute('id');
      const name = await fileInput.getAttribute('name');
      const style = await fileInput.getAttribute('style');
      const className = await fileInput.getAttribute('class');
      
      console.log(`${currentTime} - 文件输入框 ${i}: 接受=${accept}, 类型=${type}, id=${id}, name=${name}, 类名=${className}`);
      
      // 获取输入框的边界框以检查可见性
      const boundingBox = await fileInput.boundingBox();
      console.log(`${currentTime} - 边界框: ${JSON.stringify(boundingBox)}`);
      
      // 获取输入框的完整信息，包括父元素
      const parentElement = await fileInput.evaluate(el => el.parentElement.outerHTML);
      console.log(`${currentTime} - 父元素HTML: ${parentElement.slice(0, 500)}...`);
    }

    // 寻找可能触发上传的元素
    console.log(`${currentTime} - 寻找上传触发元素:`);
    
    const possibleTriggers = [
      'button:has-text("图片"), button:has-text("上传"), button:has-text("添加"), .upload-button, .add-button, [role="button"][aria-label*="上传"], [role="button"][aria-label*="图片"]'
    ];
    
    for (let selector of possibleTriggers) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`${currentTime} - 找到 ${elements.length} 个匹配选择器的元素: ${selector}`);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const text = await element.textContent();
          const className = await element.getAttribute('class');
          const boundingBox = await element.boundingBox();
          
          if (boundingBox) {
            console.log(`${currentTime} - 元素 ${i}: 文本="${text.trim()}", 类名="${className}", 可见=${boundingBox.width > 0 && boundingBox.height > 0}`);
          }
        }
      }
    }

    // 寻找拖拽区域
    const dragAreas = await page.$$('.drag-area, .upload-area, [draggable="true"]');
    console.log(`${currentTime} - 找到 ${dragAreas.length} 个拖拽区域`);
    
    for (let i = 0; i < dragAreas.length; i++) {
      const area = dragAreas[i];
      const text = await area.textContent();
      const className = await area.getAttribute('class');
      const boundingBox = await area.boundingBox();
      
      console.log(`${currentTime} - 拖拽区域 ${i}: 文本="${text.trim().slice(0, 100)}", 类名="${className}", 可见=${boundingBox?.width > 0 && boundingBox?.height > 0}`);
      
      // 检查是否有文件输入框作为子元素
      const nestedFileInputs = await area.$$('input[type="file"]');
      console.log(`${currentTime} - 拖拽区域 ${i} 包含 ${nestedFileInputs.length} 个文件输入框`);
    }

    // 保存截图
    const screenshotPath = `find-upload-trigger-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`${currentTime} - 页面截图已保存: ${screenshotPath}`);

    // 保存页面HTML
    const htmlPath = `find-upload-trigger-html-${currentTime.replace(/[:.]/g, '-')}.html`;
    const pageHTML = await page.content();
    fs.writeFileSync(htmlPath, pageHTML);
    console.log(`${currentTime} - 页面HTML已保存: ${htmlPath}`);

    await browser.close();
    console.log(`${currentTime} - 寻找完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `find-upload-trigger-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

findUploadTrigger().catch(error => console.error('寻找上传触发方式失败:', error));
