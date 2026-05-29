const { chromium } = require('playwright');

async function visitCsdnEditor() {
  const targetUrl = 'https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1&spm=1011.2415.3001.6192';
  const currentTime = new Date().toISOString();

  let browser, context, page;

  try {
    console.log(`${currentTime} - 开始访问 CSDN 文章编辑器`);
    
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

    // 保存页面截图
    const screenshotPath = `csdn-editor-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`${currentTime} - 页面截图已保存: ${screenshotPath}`);

    await browser.close();
    console.log(`${currentTime} - 任务完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `csdn-editor-error-${currentTime.replace(/[:.]/g, '-')}.png`;
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

visitCsdnEditor().catch(error => console.error('访问 CSDN 编辑器失败:', error));
