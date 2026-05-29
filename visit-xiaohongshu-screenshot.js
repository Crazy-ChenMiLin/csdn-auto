const { chromium } = require('playwright');

async function visitXiaohongshu() {
  const url = 'https://www.xiaohongshu.com';
  const currentTime = new Date().toISOString();

  try {
    console.log(`${currentTime} - 开始访问小红书 ${url}`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    // 设置视口大小，确保截图完整
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 访问小红书
    const startTime = Date.now();
    const response = await page.goto(url, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    const loadTime = Date.now() - startTime;

    if (!response || response.status() !== 200) {
      const errorMessage = `${currentTime} - 访问失败，状态码: ${response?.status() || '无响应'}`;
      console.error(errorMessage);
      await browser.close();
      return;
    }

    console.log(`${currentTime} - 访问成功，状态码: ${response.status()}`);
    console.log(`${currentTime} - 加载时间: ${loadTime}ms`);

    // 检查页面标题
    const title = await page.title();
    console.log(`${currentTime} - 页面标题: ${title}`);

    // 等待页面内容加载
    await page.waitForTimeout(3000);

    // 保存完整页面截图
    await page.screenshot({ 
      path: `xiaohongshu-screenshot-${currentTime.replace(/[:.]/g, '-')}.png`,
      fullPage: true
    });

    // 获取页面的一些基本信息
    const pageInfo = await page.evaluate(() => {
      const bodyContent = document.body.innerText;
      
      return {
        bodyLength: bodyContent.length,
        hasContent: bodyContent.length > 0
      };
    });

    console.log(`${currentTime} - 页面内容长度: ${pageInfo.bodyLength} 字符`);
    console.log(`${currentTime} - 页面是否有内容: ${pageInfo.hasContent}`);

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
  }
}

// 立即执行
visitXiaohongshu().catch(error => console.error('访问失败:', error));
