const { chromium } = require('playwright');

async function loginXiaohongshu() {
  const url = 'https://creator.xiaohongshu.com/publish/publish?from=homepage&target=image&openFilePicker=true';
  const currentTime = new Date().toISOString();

  try {
    console.log(`${currentTime} - 开始访问小红书创作者后台发布页面 ${url}`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();

    // 设置视口大小
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 访问页面
    const response = await page.goto(url, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    // 检查是否需要登录
    const loginFormSelector = 'input[placeholder="手机号"]';
    const loginForm = await page.$(loginFormSelector);
    
    if (loginForm) {
      console.log(`${currentTime} - 页面需要登录`);
      
      // 保存登录页面截图
      await page.screenshot({ 
        path: `xiaohongshu-login-page-${currentTime.replace(/[:.]/g, '-')}.png`,
        fullPage: true
      });
      
      // 打印登录页面信息
      console.log(`${currentTime} - 登录页面信息:`);
      console.log(`${currentTime} - 页面标题: ${await page.title()}`);
      
      // 获取页面上的所有输入框
      const inputs = await page.$$('input');
      console.log(`${currentTime} - 输入框数量: ${inputs.length}`);
      
      // 获取页面上的所有按钮
      const buttons = await page.$$('button');
      console.log(`${currentTime} - 按钮数量: ${buttons.length}`);
      
    } else {
      console.log(`${currentTime} - 页面已登录，显示发布页面`);
      
      // 保存发布页面截图
      await page.screenshot({ 
        path: `xiaohongshu-publish-page-${currentTime.replace(/[:.]/g, '-')}.png`,
        fullPage: true
      });
      
      // 检查文件选择器
      const fileInputSelector = 'input[type="file"]';
      const fileInput = await page.$(fileInputSelector);
      
      if (fileInput) {
        console.log(`${currentTime} - 文件选择器元素找到: ${fileInputSelector}`);
      } else {
        console.log(`${currentTime} - 文件选择器元素未找到，尝试其他选择器`);
        
        // 尝试其他可能的选择器
        const possibleSelectors = [
          'input[name="file"]',
          'input[accept="image/*"]',
          '.upload-btn',
          '.file-input',
          'button[type="file"]',
          '[data-testid="upload-button"]'
        ];
        
        for (const selector of possibleSelectors) {
          const element = await page.$(selector);
          if (element) {
            console.log(`${currentTime} - 文件选择器元素找到: ${selector}`);
            break;
          }
        }
      }
    }

    // 获取Cookie信息
    const cookies = await context.cookies();
    console.log(`${currentTime} - 获取到的Cookie信息:`);
    cookies.forEach(cookie => {
      console.log(`${currentTime} - ${cookie.name}: ${cookie.value}`);
    });

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
  }
}

// 立即执行
loginXiaohongshu().catch(error => console.error('访问失败:', error));
