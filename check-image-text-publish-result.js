const { chromium } = require('playwright');
const fs = require('fs');

async function checkImageTextPublishResult() {
  // 图文发布页面 URL
  const targetUrl = 'https://creator.douyin.com/creator-micro/content/post/image-text?enter_from=publish_page&media_type=image&type=new';
  const currentTime = new Date().toISOString();

  // 使用成功访问过的Cookie信息
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
    console.log(`${currentTime} - 开始详细检查图文发布页面`);
    
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

    // 访问图文发布页面
    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(8000);

    // 保存当前页面的详细状态
    const detailScreenshot = `douyin-image-text-detail-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: detailScreenshot, fullPage: true });
    console.log(`${currentTime} - 详细页面截图已保存: ${detailScreenshot}`);

    // 获取页面HTML内容，用于详细分析
    const pageContent = await page.content();
    const htmlPath = `douyin-image-text-detail-${currentTime.replace(/[:.]/g, '-')}.html`;
    fs.writeFileSync(htmlPath, pageContent);
    console.log(`${currentTime} - 页面HTML内容已保存: ${htmlPath}`);

    // 详细检查页面上的各个元素
    console.log(`${currentTime} - 开始详细检查页面元素:`);
    
    // 1. 检查是否有上传图片的提示或预览
    const imagePreviewSelectors = [
      '.image-preview',
      '[data-testid*="image-preview"]',
      'img[src*="http"]',
      'div[style*="background-image"]'
    ];
    
    let hasImagePreview = false;
    for (const selector of imagePreviewSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          hasImagePreview = true;
          console.log(`${currentTime} - 找到图片预览元素: ${selector}`);
          console.log(`${currentTime} - 图片预览数量: ${elements.length}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!hasImagePreview) {
      console.log(`${currentTime} - 未找到图片预览元素，可能图片上传失败`);
    }

    // 2. 检查发布按钮的状态和属性
    console.log(`${currentTime} - 检查发布按钮状态:`);
    try {
      const publishButton = await page.$('button:has-text("发布")');
      if (publishButton) {
        const buttonText = await publishButton.textContent();
        const isEnabled = await publishButton.evaluate(el => !el.disabled);
        const buttonClass = await publishButton.evaluate(el => el.className);
        const buttonStyle = await publishButton.evaluate(el => el.getAttribute('style'));
        
        console.log(`${currentTime} - 发布按钮文本: ${buttonText}`);
        console.log(`${currentTime} - 发布按钮是否可用: ${isEnabled}`);
        console.log(`${currentTime} - 发布按钮类名: ${buttonClass}`);
        console.log(`${currentTime} - 发布按钮样式: ${buttonStyle}`);
        
        // 检查按钮是否有其他状态属性
        const isLoading = await publishButton.evaluate(el => el.classList.contains('loading')) || 
                         await publishButton.textContent().includes('加载');
        console.log(`${currentTime} - 发布按钮是否正在加载: ${isLoading}`);
      } else {
        console.log(`${currentTime} - 未找到发布按钮`);
      }
    } catch (error) {
      console.error(`${currentTime} - 检查发布按钮失败: ${error.message}`);
    }

    // 3. 检查页面是否有错误提示信息
    console.log(`${currentTime} - 检查页面是否有错误提示:`);
    const errorSelectors = [
      '.error-message',
      '[class*="error"]',
      '[style*="red"]:not(script)',
      'text=错误',
      'text=失败',
      'text=请'
    ];
    
    let errorMessages = [];
    for (const selector of errorSelectors) {
      try {
        const elements = await page.$$(selector);
        for (const element of elements) {
          try {
            const textContent = await element.textContent();
            if (textContent && textContent.trim().length > 0 && textContent.trim().length < 100) {
              const isVisible = await element.evaluate(el => el.offsetParent !== null);
              if (isVisible) {
                errorMessages.push(textContent.trim());
              }
            }
          } catch (innerError) {
            continue;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    if (errorMessages.length > 0) {
      console.log(`${currentTime} - 页面上的错误提示: ${JSON.stringify(errorMessages)}`);
    } else {
      console.log(`${currentTime} - 页面上没有明显的错误提示`);
    }

    // 4. 检查是否有需要填写的必填字段
    console.log(`${currentTime} - 检查是否有必填字段未填写:`);
    const requiredSelectors = [
      '[required]',
      '[data-required="true"]',
      'input[placeholder*="必填"]',
      'textarea[placeholder*="必填"]'
    ];
    
    let requiredFields = [];
    for (const selector of requiredSelectors) {
      try {
        const elements = await page.$$(selector);
        for (const element of elements) {
          try {
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            const value = await element.evaluate(el => {
              if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                return el.value;
              } else if (el.getAttribute('contenteditable') === 'true') {
                return el.textContent;
              }
              return '';
            });
            
            if (!value || value.trim() === '') {
              const placeholder = await element.evaluate(el => el.getAttribute('placeholder'));
              requiredFields.push({
                tagName,
                selector,
                placeholder: placeholder || '无占位符'
              });
            }
          } catch (innerError) {
            continue;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    if (requiredFields.length > 0) {
      console.log(`${currentTime} - 发现必填字段未填写: ${JSON.stringify(requiredFields)}`);
    } else {
      console.log(`${currentTime} - 所有必填字段已填写`);
    }

    // 5. 检查是否有发布成功的提示或跳转
    const successSelectors = [
      'text=发布成功',
      'text=已发布',
      'text=待审核',
      'text=审核中'
    ];
    
    let hasSuccessMessage = false;
    for (const selector of successSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          hasSuccessMessage = true;
          console.log(`${currentTime} - 找到成功提示: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (hasSuccessMessage) {
      console.log(`${currentTime} - 发布成功`);
    } else {
      console.log(`${currentTime} - 未找到发布成功的提示`);
    }

    await browser.close();
    console.log(`${currentTime} - 详细检查完成`);

  } catch (error) {
    console.error(`${currentTime} - 检查失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `douyin-image-text-check-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

// 立即执行详细检查
checkImageTextPublishResult().catch(error => console.error('详细检查失败:', error));
