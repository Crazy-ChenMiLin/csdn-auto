const { chromium } = require('playwright');
const fs = require('fs');

async function checkUploadOptions() {
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

  try {
    console.log(`${currentTime} - 开始检查上传页面的选项`);
    
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

    // 检查页面上是否有内容类型选择器
    console.log('=== 检查内容类型选择器 ===');
    const contentTypeSelectors = await page.$$('input[type="radio"], input[type="checkbox"], select');
    console.log(`找到 ${contentTypeSelectors.length} 个选择器`);
    
    for (let i = 0; i < contentTypeSelectors.length; i++) {
      const selector = contentTypeSelectors[i];
      const tagName = await selector.evaluate(el => el.tagName.toLowerCase());
      const type = await selector.evaluate(el => el.type || '');
      const name = await selector.evaluate(el => el.name || '');
      const value = await selector.evaluate(el => el.value || '');
      const label = await selector.$eval('+ label', el => el.textContent, { timeout: 1000 }).catch(() => null);
      
      console.log(`选择器 ${i}: 标签=${tagName}, 类型=${type}, 名称=${name}, 值=${value}, 标签文本=${label}`);
    }

    // 检查页面上的按钮
    console.log('\n=== 检查页面按钮 ===');
    const allButtons = await page.$$('button');
    console.log(`找到 ${allButtons.length} 个按钮`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const classes = await button.evaluate(el => el.className);
      
      console.log(`按钮 ${i}: 文本="${text.trim()}", 类名=${classes}`);
    }

    // 检查文件输入框的详细信息
    console.log('\n=== 检查文件输入框 ===');
    const fileInputs = await page.$$('input[type="file"]');
    console.log(`找到 ${fileInputs.length} 个文件输入框`);
    
    for (let i = 0; i < fileInputs.length; i++) {
      const fileInput = fileInputs[i];
      
      const id = await fileInput.evaluate(el => el.id);
      const name = await fileInput.evaluate(el => el.name);
      const accept = await fileInput.evaluate(el => el.accept);
      const multiple = await fileInput.evaluate(el => el.multiple);
      
      console.log(`文件输入框 ${i}: id=${id}, name=${name}, accept=${accept}, multiple=${multiple}`);
      
      // 检查文件输入框的父元素
      const parent = await fileInput.evaluate(el => el.parentElement.outerHTML);
      console.log(`父元素 HTML: ${parent.slice(0, 300)}...`);
    }

    // 检查页面上是否有拖拽区域
    console.log('\n=== 检查拖拽区域 ===');
    const dragAreas = await page.$$('.drag-area, .upload-area, [draggable="true"]');
    console.log(`找到 ${dragAreas.length} 个拖拽区域`);
    
    for (let i = 0; i < dragAreas.length; i++) {
      const dragArea = dragAreas[i];
      const text = await dragArea.textContent();
      const classes = await dragArea.evaluate(el => el.className);
      
      console.log(`拖拽区域 ${i}: 文本="${text.trim().slice(0, 100)}...", 类名=${classes}`);
    }

    // 保存页面HTML
    const pageHTML = await page.content();
    const htmlPath = `upload-page-details-${currentTime.replace(/[:.]/g, '-')}.html`;
    fs.writeFileSync(htmlPath, pageHTML);
    console.log(`\n页面HTML已保存到: ${htmlPath}`);

    // 保存截图
    const screenshotPath = `upload-page-details-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`页面截图已保存到: ${screenshotPath}`);

    await browser.close();
    console.log('\n检查完成');

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `check-upload-options-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

checkUploadOptions().catch(error => console.error('检查上传选项失败:', error));
