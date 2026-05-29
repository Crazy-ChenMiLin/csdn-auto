const { chromium } = require('playwright');
const fs = require('fs');

async function fixPublishFlow() {
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
    console.log(`${currentTime} - 开始修复后的发布流程`);
    
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

    // 检查是否有"发布图文"选项需要点击
    const publishOptions = await page.$$('.douyin-creator-master-dropdown-item');
    console.log(`${currentTime} - 找到 ${publishOptions.length} 个发布选项`);
    
    let imageTextOption;
    for (const option of publishOptions) {
      const text = await option.textContent();
      if (text && text.includes('发布图文')) {
        imageTextOption = option;
        console.log(`${currentTime} - 找到"发布图文"选项`);
        break;
      }
    }

    if (imageTextOption) {
      console.log(`${currentTime} - 点击"发布图文"选项`);
      await imageTextOption.click();
      await page.waitForTimeout(3000);
    }

    const initialScreenshot = `fix-flow-initial-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    console.log(`${currentTime} - 初始页面截图已保存: ${initialScreenshot}`);

    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      const imagePath = '/home/node/.openclaw/workspace/playwright-example.png';
      if (fs.existsSync(imagePath)) {
        console.log(`${currentTime} - 找到文件输入框，上传示例图片`);
        await fileInput.setInputFiles(imagePath);
        await page.waitForTimeout(5000);
        
        const uploadedScreenshot = `fix-flow-uploaded-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: uploadedScreenshot, fullPage: true });
        console.log(`${currentTime} - 图片上传后截图已保存: ${uploadedScreenshot}`);
      }
    } else {
      console.log(`${currentTime} - 未找到文件输入框`);
    }

    const publishBtn = await page.$('button:has-text("高清发布")');
    if (publishBtn) {
      const isDisabled = await publishBtn.evaluate(el => el.disabled);
      
      if (!isDisabled) {
        console.log(`${currentTime} - 找到"高清发布"按钮，可点击`);
        
        await Promise.all([
          publishBtn.click(),
          page.waitForNavigation({ timeout: 10000 }).catch(error => {
            console.log(`${currentTime} - 页面没有导航，可能是异步操作: ${error.message}`);
          })
        ]);
        
        await page.waitForTimeout(5000);
        
        const publishScreenshot = `fix-flow-published-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: publishScreenshot, fullPage: true });
        console.log(`${currentTime} - 发布后截图已保存: ${publishScreenshot}`);
        
        const pageContent = await page.content();
        if (pageContent.includes('发布成功') || pageContent.includes('待审核') || pageContent.includes('已发布')) {
          console.log(`${currentTime} - 找到成功提示`);
        } else if (pageContent.includes('错误') || pageContent.includes('失败')) {
          console.log(`${currentTime} - 找到错误提示`);
        } else {
          console.log(`${currentTime} - 未找到明确的反馈信息`);
        }
        
        fs.writeFileSync(`fix-flow-final-page-${currentTime.replace(/[:.]/g, '-')}.html`, pageContent);
      } else {
        console.log(`${currentTime} - "高清发布"按钮已禁用`);
      }
    } else {
      console.log(`${currentTime} - 未找到"高清发布"按钮`);
    }

    await browser.close();
    console.log(`${currentTime} - 修复后的发布流程完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `fix-flow-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

fixPublishFlow().catch(error => console.error('修复后的发布流程失败:', error));
