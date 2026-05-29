const { chromium } = require('playwright');

async function loginProcess() {
  const loginUrl = 'https://creator.xiaohongshu.com/login';
  const currentTime = new Date().toISOString();

  try {
    console.log(`${currentTime} - 开始登录过程`);
    
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

    // 访问登录页面
    const response = await page.goto(loginUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 登录页面访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待登录页面加载完成
    await page.waitForTimeout(3000);

    // 检查登录页面元素
    const loginForm = await page.$('div.login-container');
    if (loginForm) {
      console.log(`${currentTime} - 找到登录表单`);
      
      // 检查手机号输入框
      const phoneInput = await page.$('input[placeholder="手机号"]');
      if (phoneInput) {
        console.log(`${currentTime} - 找到手机号输入框`);
      }

      // 检查验证码输入框
      const codeInput = await page.$('input[placeholder="验证码"]');
      if (codeInput) {
        console.log(`${currentTime} - 找到验证码输入框`);
      }

      // 检查发送验证码按钮
      const sendCodeBtn = await page.$('.css-1vfl29');
      if (sendCodeBtn) {
        console.log(`${currentTime} - 找到发送验证码按钮`);
        const btnText = await page.evaluate(el => el.textContent, sendCodeBtn);
        console.log(`${currentTime} - 发送验证码按钮文本: ${btnText}`);
      }
      
      // 保存登录页面截图
      await page.screenshot({ 
        path: `login-page-${currentTime.replace(/[:.]/g, '-')}.png`,
        fullPage: true
      });
    } else {
      console.log(`${currentTime} - 未找到登录表单，可能已自动登录`);
    }

    // 获取当前页面的Cookie信息
    const cookies = await context.cookies();
    console.log(`${currentTime} - 当前页面Cookie数量: ${cookies.length}`);
    cookies.forEach(cookie => {
      console.log(`${currentTime} - Cookie: ${cookie.name} = ${cookie.value}`);
    });

    // 尝试访问发布页面
    const publishUrl = 'https://creator.xiaohongshu.com/publish/publish?from=homepage&target=image&openFilePicker=true';
    console.log(`${currentTime} - 尝试访问发布页面: ${publishUrl}`);
    
    const publishResponse = await page.goto(publishUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 发布页面访问状态码: ${publishResponse?.status() || '无响应'}`);
    
    // 检查是否是登录页面
    const isLoginPage = await page.evaluate(() => {
      return document.querySelector('.login-container') !== null || 
             document.body.innerText.includes('登录') || 
             document.body.innerText.includes('手机号');
    });

    if (isLoginPage) {
      console.log(`${currentTime} - 仍在登录页面，Cookie无效`);
      
      // 保存截图
      await page.screenshot({ 
        path: `publish-still-login-${currentTime.replace(/[:.]/g, '-')}.png`,
        fullPage: true
      });
    } else {
      console.log(`${currentTime} - 成功访问发布页面`);
      
      // 检查文件上传元素
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        console.log(`${currentTime} - 找到文件上传元素!`);
      } else {
        console.log(`${currentTime} - 未找到文件上传元素，但已成功访问发布页面`);
      }
      
      // 保存截图
      await page.screenshot({ 
        path: `publish-page-${currentTime.replace(/[:.]/g, '-')}.png`,
        fullPage: true
      });
    }

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 登录过程失败: ${error.message}`;
    console.error(errorMessage);
  }
}

// 立即执行
loginProcess().catch(error => console.error('登录过程失败:', error));
