const { chromium } = require('playwright');
const fs = require('fs');

async function checkUploadPage() {
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
    console.log(`${currentTime} - 开始检查上传页面`);
    
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

    await page.waitForTimeout(5000);

    // 检查页面标题和URL
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log(`${currentTime} - 页面标题: ${pageTitle}`);
    console.log(`${currentTime} - 当前URL: ${pageUrl}`);

    // 检查是否有内容类型选择
    const contentTypeElements = await page.$$('.publish-button, .content-type, [data-type="image"], [data-type="article"], [data-type="video"]');
    console.log(`${currentTime} - 找到 ${contentTypeElements.length} 个内容类型选择元素`);
    
    for (let i = 0; i < contentTypeElements.length; i++) {
      const text = await contentTypeElements[i].textContent();
      console.log(`${currentTime} - 内容类型 ${i}: ${text.trim()}`);
    }

    // 检查是否有图片上传相关的元素
    const imageUploadElements = await page.$$('[placeholder*="图片"], [aria-label*="图片"], [class*="image"], [class*="upload"]');
    console.log(`${currentTime} - 找到 ${imageUploadElements.length} 个图片上传相关元素`);
    
    // 检查是否有文件输入框
    const fileInputs = await page.$$('input[type="file"]');
    console.log(`${currentTime} - 找到 ${fileInputs.length} 个文件输入框`);
    
    if (fileInputs.length > 0) {
      const imagePath = '/home/node/.openclaw/workspace/playwright-example.png';
      if (fs.existsSync(imagePath)) {
        console.log(`${currentTime} - 尝试上传图片`);
        await fileInputs[0].setInputFiles(imagePath);
        await page.waitForTimeout(5000);
        
        const afterUploadScreenshot = `upload-page-after-upload-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: afterUploadScreenshot, fullPage: true });
        console.log(`${currentTime} - 图片上传后截图已保存: ${afterUploadScreenshot}`);
      }
    }

    // 检查是否有发布相关的按钮
    const publishButtons = await page.$$('button:has-text("发布"), button:has-text("提交"), button[type="submit"]');
    console.log(`${currentTime} - 找到 ${publishButtons.length} 个发布/提交按钮`);
    
    if (publishButtons.length > 0) {
      for (let i = 0; i < publishButtons.length; i++) {
        const buttonText = await publishButtons[i].textContent();
        const buttonDisabled = await publishButtons[i].evaluate(el => el.disabled);
        console.log(`${currentTime} - 按钮 ${i}: "${buttonText.trim()}", 禁用状态: ${buttonDisabled}`);
        
        if (!buttonDisabled) {
          console.log(`${currentTime} - 点击发布按钮 ${i}`);
          await Promise.all([
            publishButtons[i].click(),
            page.waitForNavigation({ timeout: 10000 }).catch(error => {
              console.log(`${currentTime} - 页面没有导航，可能是异步操作: ${error.message}`);
            })
          ]);
          
          await page.waitForTimeout(3000);
          
          const afterClickScreenshot = `upload-page-after-click-${i}-${currentTime.replace(/[:.]/g, '-')}.png`;
          await page.screenshot({ path: afterClickScreenshot, fullPage: true });
          console.log(`${currentTime} - 点击后截图已保存: ${afterClickScreenshot}`);
          
          // 检查是否有成功提示
          const pageContent = await page.textContent('body');
          if (pageContent.includes('发布成功') || pageContent.includes('待审核')) {
            console.log(`${currentTime} - 找到成功/待审核提示`);
            break;
          } else if (pageContent.includes('错误') || pageContent.includes('失败')) {
            console.log(`${currentTime} - 找到错误/失败提示`);
          }
        }
      }
    }

    // 检查页面上的所有链接
    const links = await page.$$('a');
    console.log(`${currentTime} - 找到 ${links.length} 个链接`);
    
    const contentLinks = [];
    for (let i = 0; i < links.length; i++) {
      const href = await links[i].getAttribute('href');
      const text = await links[i].textContent();
      
      if (href && (href.includes('content') || href.includes('publish') || href.includes('post'))) {
        contentLinks.push({
          text: text.trim(),
          href: href
        });
      }
    }
    
    console.log(`${currentTime} - 内容相关链接:`, contentLinks);

    const finalScreenshot = `upload-page-final-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`${currentTime} - 最终页面截图已保存: ${finalScreenshot}`);

    await browser.close();
    console.log(`${currentTime} - 检查完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `upload-page-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

checkUploadPage().catch(error => console.error('检查上传页面失败:', error));
