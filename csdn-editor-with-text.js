const { chromium } = require('playwright');

async function visitCsdnEditorWithText() {
  const targetUrl = 'https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1&spm=1011.2415.3001.6192';
  const currentTime = new Date().toISOString();

  let browser, context, page;

  try {
    console.log(`${currentTime} - 开始访问 CSDN 文章编辑器并输入文字`);
    
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: false
    });
    
    page = await context.newPage();

    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待页面加载完成
    await page.waitForTimeout(8000);

    // 检查是否有登录二维码
    const loginQRCodeSelectors = [
      '.login-qrcode',
      'img[src*="qrcode"]',
      'div[class*="qrcode"]'
    ];
    
    let hasLoginQRCode = false;
    for (const selector of loginQRCodeSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          hasLoginQRCode = true;
          console.log(`${currentTime} - 找到登录二维码，使用选择器: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (hasLoginQRCode) {
      console.log(`${currentTime} - 页面显示登录二维码，无法直接输入文字`);
    } else {
      console.log(`${currentTime} - 页面未显示登录二维码，尝试输入文字`);
      
      // 找到标题输入框并输入文字
      const titleInputSelectors = [
        'input[name*="title"]',
        'input[placeholder*="标题"]',
        '.title-input'
      ];
      
      let titleInputFound = false;
      for (const selector of titleInputSelectors) {
        try {
          const titleInput = await page.$(selector);
          if (titleInput) {
            await titleInput.fill('测试标题');
            console.log(`${currentTime} - 标题已填写`);
            titleInputFound = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!titleInputFound) {
        console.log(`${currentTime} - 未找到标题输入框`);
      }
      
      // 找到内容输入框并输入文字
      const contentInputSelectors = [
        'textarea[name*="content"]',
        'textarea[placeholder*="内容"]',
        '.content-input',
        '[contenteditable="true"]'
      ];
      
      let contentInputFound = false;
      for (const selector of contentInputSelectors) {
        try {
          const contentInput = await page.$(selector);
          if (contentInput) {
            await contentInput.fill('这是测试内容，用于验证 CSDN 编辑器的功能');
            console.log(`${currentTime} - 内容已填写`);
            contentInputFound = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!contentInputFound) {
        console.log(`${currentTime} - 未找到内容输入框`);
      }
    }

    // 保存页面截图
    const screenshotPath = `csdn-editor-with-text-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`${currentTime} - 页面截图已保存: ${screenshotPath}`);

    await browser.close();
    console.log(`${currentTime} - 任务完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `csdn-editor-with-text-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

visitCsdnEditorWithText().catch(error => console.error('访问 CSDN 编辑器失败:', error));
