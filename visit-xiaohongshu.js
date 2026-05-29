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

    // 访问小红书
    const startTime = Date.now();
    const response = await page.goto(url, {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
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

    // 检查页面内容是否包含小红书标志性元素
    const hasXiaohongshuElements = await page.evaluate(() => {
      return document.querySelectorAll('meta[name="description"]').length > 0 &&
             document.querySelectorAll('meta[property="og:site_name"]').length > 0;
    });

    if (hasXiaohongshuElements) {
      console.log(`${currentTime} - 页面内容包含小红书标志性元素`);
    } else {
      console.log(`${currentTime} - 警告: 页面内容不包含小红书标志性元素`);
    }

    // 保存截图
    await page.screenshot({ 
      path: `xiaohongshu-screenshot-${currentTime.replace(/[:.]/g, '-')}.png`,
      fullPage: true
    });

    // 获取页面的一些基本信息
    const pageInfo = await page.evaluate(() => {
      const headTags = document.querySelectorAll('meta, link, script');
      const links = document.querySelectorAll('a[href]');
      
      return {
        headTagsCount: headTags.length,
        linksCount: links.length
      };
    });

    console.log(`${currentTime} - 页面信息: ${pageInfo.headTagsCount}个头部标签，${pageInfo.linksCount}个链接`);

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
  }
}

// 立即执行
visitXiaohongshu().catch(error => console.error('访问失败:', error));
