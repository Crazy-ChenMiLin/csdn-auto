const { chromium } = require('playwright');

async function publishCsdnBlog() {
  const targetUrl = 'https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1&spm=1011.2415.3001.6192';
  const currentTime = new Date().toISOString();
  
  // 简化的 Cookie 数组（只包含关键认证 Cookie）
  const cookies = [
    { "name": "UserToken", "value": "3390401ac9484771b8df4061c7d864a8", "domain": ".csdn.net", "path": "/", "httpOnly": true, "secure": false, "sameSite": "Lax" },
    { "name": "SESSION", "value": "4be2b3be-dcc7-429e-a1c5-0e3b8f841943", "domain": ".csdn.net", "path": "/", "httpOnly": true, "secure": false, "sameSite": "Lax" },
    { "name": "UserName", "value": "a111ajaj", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "UN", "value": "a111ajaj", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "UserInfo", "value": "3390401ac9484771b8df4061c7d864a8", "domain": ".csdn.net", "path": "/", "httpOnly": true, "secure": false, "sameSite": "Lax" },
    { "name": "UserNick", "value": "%E7%A8%8B%E5%BA%8F%E5%91%98-%E5%A4%A7%E7%B1%B3", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "AU", "value": "46F", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "p_uid", "value": "U010000", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" }
  ];
  
  // 要发布的博客内容
  const blogTitle = "使用 OpenClaw 自动化发布博客文章的实践";
  const blogContent = "本文介绍了如何使用 OpenClaw 平台结合 Playwright 自动化工具，实现 CSDN 博客平台的自动发布功能。通过 Cookie 认证方式，我们成功绕过了登录验证，实现了博客内容的自动化发布。这种自动化方案可以大大提高内容发布的效率，特别适合需要批量发布文章的场景。";
  const blogTag = "人工智能";

  let browser, context, page;

  try {
    console.log(`${currentTime} - 开始访问 CSDN 博客编辑器`);
    
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    await context.addCookies(cookies);
    page = await context.newPage();

    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(10000);

    // 填写标题
    console.log(`${currentTime} - 开始填写标题`);
    try {
      const titleInput = await page.locator('input[placeholder*="标题"], input[name*="title"], .title-input').first();
      await titleInput.fill(blogTitle);
      console.log(`${currentTime} - 标题填写成功: ${blogTitle}`);
    } catch (error) {
      console.log(`${currentTime} - 标题填写失败: ${error.message}`);
    }

    // 填写内容
    console.log(`${currentTime} - 开始填写内容`);
    try {
      const contentInput = await page.locator('textarea, [contenteditable="true"]').nth(1);
      await contentInput.fill(blogContent);
      console.log(`${currentTime} - 内容填写成功，长度: ${blogContent.length} 字`);
    } catch (error) {
      console.log(`${currentTime} - 内容填写失败: ${error.message}`);
    }

    await page.waitForTimeout(3000);

    // 选择标签
    console.log(`${currentTime} - 开始选择标签: ${blogTag}`);
    try {
      const tagInput = await page.locator('input[placeholder*="标签"], .tag-input').first();
      await tagInput.fill(blogTag);
      await page.waitForTimeout(1000);
      
      // 选择标签建议
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      console.log(`${currentTime} - 标签选择成功`);
    } catch (error) {
      console.log(`${currentTime} - 标签选择失败: ${error.message}`);
    }

    await page.waitForTimeout(2000);

    // 点击发布按钮
    console.log(`${currentTime} - 开始点击发布按钮`);
    try {
      const publishButton = await page.locator('button:has-text("发布"), button:has-text("发表"), .publish-btn').first();
      await publishButton.click();
      console.log(`${currentTime} - 发布按钮点击成功`);
    } catch (error) {
      console.log(`${currentTime} - 发布按钮点击失败: ${error.message}`);
    }

    await page.waitForTimeout(5000);

    // 保存截图
    const screenshotPath = `csdn-publish-result-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`${currentTime} - 截图已保存: ${screenshotPath}`);

    await browser.close();
    console.log(`${currentTime} - 任务完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `csdn-publish-error-${currentTime.replace(/[:.]/g, '-')}.png`;
      try {
        await page.screenshot({ path: errorScreenshot, fullPage: true });
        console.log(`${currentTime} - 错误截图已保存: ${errorScreenshot}`);
      } catch (screenshotError) {
        console.error(`${currentTime} - 错误截图保存失败: ${screenshotError.message}`);
      }
    }
    if (browser) {
      await browser.close();
    }
  }
}

publishCsdnBlog().catch(error => console.error('CSDN 博客发布失败:', error));
