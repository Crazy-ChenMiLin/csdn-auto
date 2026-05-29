const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function completePublishFlow() {
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
    console.log(`${currentTime} - 开始完整的发布流程`);
    
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

    // 1. 检查页面上是否有内容类型选择
    console.log(`${currentTime} - 检查内容类型选择`);
    const contentTypeElements = await page.$$('input[name*="type"], select[name*="type"], .content-type-select');
    if (contentTypeElements.length > 0) {
      console.log(`${currentTime} - 找到 ${contentTypeElements.length} 个内容类型选择元素`);
      
      for (let i = 0; i < contentTypeElements.length; i++) {
        const element = contentTypeElements[i];
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'select') {
          await element.select('1'); // 选择图片类型
          console.log(`${currentTime} - 选择图片类型`);
        } else if (tagName === 'input') {
          const type = await element.evaluate(el => el.type);
          if (type === 'radio') {
            const value = await element.evaluate(el => el.value);
            if (value.includes('image') || value === '1') {
              await element.click();
              console.log(`${currentTime} - 选择图片类型: ${value}`);
            }
          }
        }
      }
    }

    // 2. 上传图片
    console.log(`${currentTime} - 开始上传图片`);
    const imagePath = path.resolve(__dirname, 'playwright-example.png');
    console.log(`${currentTime} - 图片路径: ${imagePath}`);
    
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log(`${currentTime} - 找到文件输入框`);
      
      await fileInput.setInputFiles(imagePath);
      console.log(`${currentTime} - 文件已选择`);
      
      await page.waitForTimeout(5000); // 等待上传完成
      
      const afterUploadScreenshot = `complete-publish-flow-after-upload-${currentTime.replace(/[:.]/g, '-')}.png`;
      await page.screenshot({ path: afterUploadScreenshot, fullPage: true });
      console.log(`${currentTime} - 上传后截图已保存: ${afterUploadScreenshot}`);
    } else {
      console.log(`${currentTime} - 未找到文件输入框，尝试查找上传按钮`);
      const uploadButton = await page.$('button:has-text("上传")');
      if (uploadButton) {
        console.log(`${currentTime} - 找到上传按钮，点击打开上传窗口`);
        await uploadButton.click();
        await page.waitForTimeout(3000);
        
        // 检查是否有新的文件输入框出现
        const newFileInput = await page.$('input[type="file"]');
        if (newFileInput) {
          console.log(`${currentTime} - 找到新的文件输入框`);
          await newFileInput.setInputFiles(imagePath);
          console.log(`${currentTime} - 文件已选择`);
          
          await page.waitForTimeout(5000);
          
          const afterUploadScreenshot = `complete-publish-flow-after-upload-${currentTime.replace(/[:.]/g, '-')}.png`;
          await page.screenshot({ path: afterUploadScreenshot, fullPage: true });
          console.log(`${currentTime} - 上传后截图已保存: ${afterUploadScreenshot}`);
        }
      }
    }

    // 3. 填写标题和描述
    console.log(`${currentTime} - 填写标题和描述`);
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

    // 4. 等待页面准备就绪
    await page.waitForTimeout(3000);
    
    const beforePublishScreenshot = `complete-publish-flow-before-publish-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: beforePublishScreenshot, fullPage: true });
    console.log(`${currentTime} - 发布前截图已保存: ${beforePublishScreenshot}`);

    // 5. 找到并点击发布按钮
    const publishButton = await page.$('button:has-text("高清发布")');
    if (publishButton) {
      console.log(`${currentTime} - 找到"高清发布"按钮`);
      
      const isDisabled = await publishButton.evaluate(el => el.disabled);
      if (!isDisabled) {
        console.log(`${currentTime} - 按钮可点击，点击发布`);
        
        await Promise.all([
          publishButton.click(),
          page.waitForNavigation({ timeout: 10000 }).catch(error => {
            console.log(`${currentTime} - 页面没有导航，可能是异步操作: ${error.message}`);
          })
        ]);
        
        await page.waitForTimeout(5000);
        
        const afterPublishScreenshot = `complete-publish-flow-after-publish-${currentTime.replace(/[:.]/g, '-')}.png`;
        await page.screenshot({ path: afterPublishScreenshot, fullPage: true });
        console.log(`${currentTime} - 发布后截图已保存: ${afterPublishScreenshot}`);
        
        // 检查是否有成功提示
        const pageContent = await page.textContent('body');
        if (pageContent.includes('发布成功') || pageContent.includes('待审核')) {
          console.log(`${currentTime} - 找到成功/待审核提示: ${pageContent.includes('发布成功') ? '发布成功' : '待审核'}`);
          
          const successScreenshot = `complete-publish-flow-success-${currentTime.replace(/[:.]/g, '-')}.png`;
          await page.screenshot({ path: successScreenshot, fullPage: true });
          console.log(`${currentTime} - 成功截图已保存: ${successScreenshot}`);
        } else if (pageContent.includes('错误') || pageContent.includes('失败')) {
          console.log(`${currentTime} - 找到错误/失败提示: ${pageContent.includes('错误') ? '错误' : '失败'}`);
          
          // 尝试找到错误详情
          const errorElements = await page.$$('.error-message, .ant-message-error, [class*="error"]');
          for (let i = 0; i < errorElements.length; i++) {
            const errorText = await errorElements[i].textContent();
            if (errorText.trim()) {
              console.log(`${currentTime} - 错误详情: ${errorText.trim()}`);
            }
          }
        }
      } else {
        console.log(`${currentTime} - 发布按钮不可点击，可能需要完成其他必填项`);
        
        // 检查是否有必填项提示
        const requiredElements = await page.$$('[required], .required, .ant-form-item-required');
        if (requiredElements.length > 0) {
          console.log(`${currentTime} - 找到 ${requiredElements.length} 个必填项`);
          
          for (let i = 0; i < requiredElements.length; i++) {
            const element = requiredElements[i];
            const rect = await element.boundingBox();
            if (rect) {
              const parent = await element.evaluate(el => el.parentElement);
              const parentText = parent ? await page.evaluate(el => el.textContent, parent) : '无';
              console.log(`${currentTime} - 必填项 ${i}: ${parentText.trim()}`);
            }
          }
        }
      }
    } else {
      console.log(`${currentTime} - 未找到"高清发布"按钮`);
      
      // 检查是否有其他发布按钮
      const otherPublishButtons = await page.$$('button:has-text("发布")');
      if (otherPublishButtons.length > 0) {
        console.log(`${currentTime} - 找到 ${otherPublishButtons.length} 个其他发布按钮`);
        
        for (let i = 0; i < otherPublishButtons.length; i++) {
          const buttonText = await otherPublishButtons[i].textContent();
          const isDisabled = await otherPublishButtons[i].evaluate(el => el.disabled);
          
          if (!isDisabled) {
            console.log(`${currentTime} - 点击其他发布按钮: ${buttonText.trim()}`);
            
            await Promise.all([
              otherPublishButtons[i].click(),
              page.waitForNavigation({ timeout: 10000 }).catch(error => {
                console.log(`${currentTime} - 页面没有导航，可能是异步操作: ${error.message}`);
              })
            ]);
            
            await page.waitForTimeout(5000);
            
            const afterPublishScreenshot = `complete-publish-flow-after-publish-${i}-${currentTime.replace(/[:.]/g, '-')}.png`;
            await page.screenshot({ path: afterPublishScreenshot, fullPage: true });
            console.log(`${currentTime} - 发布后截图已保存: ${afterPublishScreenshot}`);
            
            break;
          }
        }
      }
    }

    await browser.close();
    console.log(`${currentTime} - 完整发布流程完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `complete-publish-flow-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

completePublishFlow().catch(error => console.error('完整发布流程失败:', error));
