const { chromium } = require('playwright');
const fs = require('fs');

async function operateUploadPage() {
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
    console.log(`${currentTime} - 开始操作上传页面`);
    
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

    // 检查页面上所有按钮的文本内容
    const allButtons = await page.$$('button');
    console.log(`${currentTime} - 找到 ${allButtons.length} 个按钮`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const text = await allButtons[i].textContent();
      const disabled = await allButtons[i].evaluate(el => el.disabled);
      const classes = await allButtons[i].evaluate(el => el.className);
      console.log(`${currentTime} - 按钮 ${i}: "${text.trim()}", 禁用: ${disabled}, 类名: ${classes}`);
    }

    // 检查页面上所有与"下一步"或"发布"相关的按钮
    const nextButtons = await page.$$('button:has-text("下一步"), button:has-text("发布"), button:has-text("高清发布")');
    console.log(`${currentTime} - 找到 ${nextButtons.length} 个与发布相关的按钮`);
    
    for (let i = 0; i < nextButtons.length; i++) {
      const text = await nextButtons[i].textContent();
      const disabled = await nextButtons[i].evaluate(el => el.disabled);
      const rect = await nextButtons[i].boundingBox();
      console.log(`${currentTime} - 发布按钮 ${i}: "${text.trim()}", 禁用: ${disabled}, 位置: ${rect ? `${rect.x}, ${rect.y}, ${rect.width}x${rect.height}` : '不可见'}`);
      
      if (!disabled && rect) {
        console.log(`${currentTime} - 点击发布按钮: ${text.trim()}`);
        
        // 点击按钮
        await Promise.all([
          nextButtons[i].click(),
          page.waitForNavigation({ timeout: 10000 }).catch(error => {
            console.log(`${currentTime} - 页面没有导航，可能是异步操作: ${error.message}`);
          })
        ]);
        
        await page.waitForTimeout(3000);
        
        const afterClickScreenshot = `operate-upload-page-after-click-${i}-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: afterClickScreenshot, fullPage: true });
        console.log(`${currentTime} - 点击后截图已保存: ${afterClickScreenshot}`);
        
        // 检查是否有成功提示
        const pageContent = await page.textContent('body');
        if (pageContent.includes('发布成功') || pageContent.includes('待审核')) {
          console.log(`${currentTime} - 找到成功/待审核提示: ${pageContent.includes('发布成功') ? '发布成功' : '待审核'}`);
          
          const successScreenshot = `operate-upload-page-success-${currentTime.replace(/[:.]/g, '-')}.png`;
          await page.screenshot({ path: successScreenshot, fullPage: true });
          console.log(`${currentTime} - 成功截图已保存: ${successScreenshot}`);
          
          break;
        } else if (pageContent.includes('错误') || pageContent.includes('失败')) {
          console.log(`${currentTime} - 找到错误/失败提示: ${pageContent.includes('错误') ? '错误' : '失败'}`);
        }
      }
    }

    // 检查页面上是否有输入框
    const textInputs = await page.$$('input[type="text"], input[type="textarea"], textarea');
    console.log(`${currentTime} - 找到 ${textInputs.length} 个文本输入框`);
    
    for (let i = 0; i < textInputs.length; i++) {
      const placeholder = await textInputs[i].getAttribute('placeholder');
      const value = await textInputs[i].inputValue();
      const type = await textInputs[i].getAttribute('type');
      console.log(`${currentTime} - 输入框 ${i}: 类型 ${type || 'text'}, 占位符 "${placeholder}", 值 "${value}"`);
    }

    // 检查页面上是否有必填字段的提示
    const requiredElements = await page.$$('[required], [aria-required="true"], [class*="required"]');
    console.log(`${currentTime} - 找到 ${requiredElements.length} 个必填字段`);
    
    for (let i = 0; i < requiredElements.length; i++) {
      const tagName = await requiredElements[i].evaluate(el => el.tagName.toLowerCase());
      const text = await requiredElements[i].textContent();
      const classes = await requiredElements[i].evaluate(el => el.className);
      console.log(`${currentTime} - 必填字段 ${i}: 标签 ${tagName}, 文本 "${text.trim()}", 类名 ${classes}`);
    }

    // 保存页面HTML内容
    const htmlContent = await page.content();
    const htmlPath = `operate-upload-page-html-${currentTime.replace(/[:.]/g, '-')}.html`;
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`${currentTime} - 页面HTML已保存到: ${htmlPath}`);

    // 保存可见文本
    const visibleText = await page.textContent('body');
    const textPath = `operate-upload-page-text-${currentTime.replace(/[:.]/g, '-')}.txt`;
    fs.writeFileSync(textPath, visibleText);
    console.log(`${currentTime} - 页面可见文本已保存到: ${textPath}`);

    // 最后截图
    const finalScreenshot = `operate-upload-page-final-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`${currentTime} - 最终截图已保存: ${finalScreenshot}`);

    await browser.close();
    console.log(`${currentTime} - 操作完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `operate-upload-page-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

operateUploadPage().catch(error => console.error('操作上传页面失败:', error));
