const { chromium } = require('playwright');

async function directPublishAccess() {
  const publishUrl = 'https://creator.xiaohongshu.com/publish/publish?from=homepage&target=image&openFilePicker=true';
  const currentTime = new Date().toISOString();

  try {
    console.log(`${currentTime} - 直接访问发布页面 ${publishUrl}`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: false
    });
    
    const page = await context.newPage();

    // 直接访问发布页面
    const response = await page.goto(publishUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 发布页面访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待页面加载完成
    await page.waitForTimeout(5000);

    // 检查是否是登录页面
    const isLoginPage = await page.evaluate(() => {
      return document.querySelector('.login-container') !== null || 
             document.body.innerText.includes('登录') || 
             document.body.innerText.includes('手机号');
    });

    if (isLoginPage) {
      console.log(`${currentTime} - 需要登录，页面显示登录表单`);
      
      // 保存登录页面截图
      await page.screenshot({ 
        path: `publish-requires-login-${currentTime.replace(/[:.]/g, '-')}.png`,
        fullPage: true
      });
      
      // 输出页面HTML内容
      const htmlContent = await page.content();
      console.log(`${currentTime} - 页面HTML前500字符: ${htmlContent.slice(0, 500)}`);
      
    } else {
      console.log(`${currentTime} - 成功访问发布页面，无需登录`);
      
      // 检查页面内容
      const visibleText = await page.evaluate(() => {
        return document.body.innerText;
      });
      
      console.log(`${currentTime} - 页面可见文本前200字符: ${visibleText.slice(0, 200)}`);
      
      // 查找文件上传元素
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        console.log(`${currentTime} - 找到文件上传元素!`);
        
        // 尝试获取元素属性
        const inputAttributes = await page.evaluate(el => {
          const attrs = {};
          el.getAttributeNames().forEach(name => {
            attrs[name] = el.getAttribute(name);
          });
          return attrs;
        }, fileInput);
        
        console.log(`${currentTime} - 文件上传元素属性:`, inputAttributes);
        
      } else {
        console.log(`${currentTime} - 未找到直接的文件上传元素，寻找其他可能的选择器`);
        
        // 查找可能的文件上传相关元素
        const possibleSelectors = [
          'input[type="file"]',
          'input[name="file"]',
          'input[accept="image/*"]',
          '.upload-btn',
          '.file-input',
          'button[type="file"]',
          '[data-testid="upload-button"]',
          '.upload-container',
          '.file-picker',
          '[data-role="upload"]'
        ];
        
        for (const selector of possibleSelectors) {
          const elements = await page.$$(selector);
          console.log(`${currentTime} - 选择器 ${selector}: 找到 ${elements.length} 个元素`);
        }
      }
      
      // 保存发布页面截图
      await page.screenshot({ 
        path: `publish-page-access-${currentTime.replace(/[:.]/g, '-')}.png`,
        fullPage: true
      });
    }

    // 获取Cookie信息
    const cookies = await context.cookies();
    console.log(`${currentTime} - 页面Cookie数量: ${cookies.length}`);
    cookies.forEach(cookie => {
      console.log(`${currentTime} - Cookie: ${cookie.name} = ${cookie.value}`);
    });

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
    if (error.stack) {
      console.error(error.stack.slice(0, 200));
    }
  }
}

// 立即执行
directPublishAccess().catch(error => console.error('访问失败:', error));
