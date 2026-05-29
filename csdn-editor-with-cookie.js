const { chromium } = require('playwright');

async function visitCsdnEditorWithCookie() {
  const targetUrl = 'https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1&spm=1011.2415.3001.6192';
  const currentTime = new Date().toISOString();

  // Cookie 数组
  const cookies = [
    { "name": "c_first_page", "value": "https%3A//www.csdn.net/", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "dc_tos", "value": "telyaa", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "UN", "value": "a111ajaj", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "UserToken", "value": "3390401ac9484771b8df4061c7d864a8", "domain": ".csdn.net", "path": "/", "httpOnly": true, "secure": false, "sameSite": "Lax" },
    { "name": "SESSION", "value": "4be2b3be-dcc7-429e-a1c5-0e3b8f841943", "domain": ".csdn.net", "path": "/", "httpOnly": true, "secure": false, "sameSite": "Lax" },
    { "name": "UserName", "value": "a111ajaj", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "UserInfo", "value": "3390401ac9484771b8df4061c7d864a8", "domain": ".csdn.net", "path": "/", "httpOnly": true, "secure": false, "sameSite": "Lax" },
    { "name": "UserNick", "value": "%E7%A8%8B%E5%BA%8F%E5%91%98-%E5%A4%A7%E7%B1%B3", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "AU", "value": "46F", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "p_uid", "value": "U010000", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "csdn_newcert_a111ajaj", "value": "1", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "dc_sid", "value": "ec34b9dfd98f99209a86d6c75ff2bcab", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "c_segment", "value": "13", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "fid", "value": "20_16457665756-1776745867689-665842", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "uuid_tt_dd", "value": "10_37518540810-1776745858469-762253", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "c_page_id", "value": "default", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "c_pref", "value": "https%3A//mp.csdn.net/mp_blog/manage/article%3Fspm%3D1011.2480.3001.8124", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "c_ref", "value": "https%3A//mp.csdn.net/", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "c_first_ref", "value": "cn.bing.com", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "c_dsid", "value": "11_1778056869549.322620", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "c_first_page", "value": "https%3A//www.csdn.net/", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" }
  ];

  let browser, context, page;

  try {
    console.log(`${currentTime} - 开始使用 Cookie 访问 CSDN 文章编辑器`);
    
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    // 添加 Cookie
    await context.addCookies(cookies);
    
    page = await context.newPage();

    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待页面加载完成
    await page.waitForTimeout(10000);

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
      console.log(`${currentTime} - 页面显示登录二维码，Cookie 认证失败`);
    } else {
      console.log(`${currentTime} - 页面未显示登录二维码，Cookie 认证成功，尝试输入文字`);
      
      // 尝试找到并填写标题
      try {
        await page.fill('input[placeholder*="标题"], input[name*="title"], .title-input', '测试标题');
        console.log(`${currentTime} - 标题已填写`);
      } catch (error) {
        console.log(`${currentTime} - 未找到或填写标题输入框: ${error.message}`);
      }
      
      // 尝试找到并填写内容
      try {
        const contentSelectors = [
          'textarea[placeholder*="内容"]',
          'textarea[name*="content"]',
          '[contenteditable="true"]',
          '.editor-content'
        ];
        
        let contentFilled = false;
        for (const selector of contentSelectors) {
          try {
            const contentElement = await page.$(selector);
            if (contentElement) {
              await contentElement.fill('这是测试内容，用于验证 CSDN 编辑器的功能');
              console.log(`${currentTime} - 内容已填写，使用选择器: ${selector}`);
              contentFilled = true;
              break;
            }
          } catch (fillError) {
            continue;
          }
        }
        
        if (!contentFilled) {
          console.log(`${currentTime} - 未找到或填写内容输入框`);
        }
      } catch (error) {
        console.log(`${currentTime} - 内容填写失败: ${error.message}`);
      }
    }

    // 保存页面截图
    const screenshotPath = `csdn-editor-with-cookie-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`${currentTime} - 页面截图已保存: ${screenshotPath}`);

    await browser.close();
    console.log(`${currentTime} - 任务完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `csdn-editor-with-cookie-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

visitCsdnEditorWithCookie().catch(error => console.error('访问 CSDN 编辑器失败:', error));
