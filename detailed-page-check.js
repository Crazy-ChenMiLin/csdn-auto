const { chromium } = require('playwright');

async function detailedPageCheck() {
  const url = 'https://creator.xiaohongshu.com/publish/publish?from=homepage&target=image&openFilePicker=true';
  const currentTime = new Date().toISOString();

  // 使用之前访问获取的Cookie信息
  const cookies = [
    {
      "name": "acw_tc",
      "value": "0a50873b17780378271895805e64cefa602dbea96afc318c141c57e5d1ccf4",
      "domain": "creator.xiaohongshu.com",
      "path": "/",
      "expires": 1778297027,
      "httpOnly": true,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "ets",
      "value": "1778037824355",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1780629824.355,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "xsecappid",
      "value": "ugc",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809572670,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "a1",
      "value": "19dfb501de019ts68vgk7uk21zmvaky1rjeqxy56540000197105",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809073044,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "webId",
      "value": "c7313eb1a42d1617c82a7232b0e00afc",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809073044,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "loadts",
      "value": "1778037827071",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809572670,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "websectiga",
      "value": "88%3B6be45f388a1ee7bf611a69f3e174cae4%3Bf1ea02c0f8ec3256031b8be9c7ee",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1778295868,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "sec_poison_id",
      "value": "21ec1819-d043-4e08-bf16-8df653375f82",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1778037273,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    }
  ];

  try {
    console.log(`${currentTime} - 开始详细页面检查 ${url}`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const context = await browser.newContext();
    
    // 设置Cookie
    await context.addCookies(cookies);
    
    const page = await context.newPage();

    // 设置视口大小
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 监听网络请求
    page.on('request', request => console.log(`Request: ${request.method()} ${request.url()}`));
    page.on('response', response => console.log(`Response: ${response.status()} ${response.url()}`));

    // 访问页面
    const response = await page.goto(url, {
      timeout: 60000,
      waitUntil: 'domcontentloaded'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待JavaScript加载和执行
    await page.waitForTimeout(10000);

    // 保存页面截图
    await page.screenshot({ 
      path: `detailed-check-${currentTime.replace(/[:.]/g, '-')}.png`,
      fullPage: true
    });

    // 获取页面HTML内容
    const pageContent = await page.content();

    // 检查页面是否有JavaScript执行错误
    const errors = await page.evaluate(() => {
      const errors = [];
      window.addEventListener('error', (e) => {
        errors.push(e.message);
      });
      return errors;
    });

    console.log(`${currentTime} - JavaScript错误: ${errors.length} 个`);
    errors.forEach(error => console.log(`${currentTime} - 错误: ${error}`));

    // 获取页面渲染信息
    const renderInfo = await page.evaluate(() => {
      return {
        bodyWidth: document.body.clientWidth,
        bodyHeight: document.body.clientHeight,
        bodyContent: document.body.textContent.length,
        title: document.title,
        metaTags: document.querySelectorAll('meta').length
      };
    });

    console.log(`${currentTime} - 页面渲染信息:`);
    console.log(`${currentTime} - 标题: ${renderInfo.title}`);
    console.log(`${currentTime} - 宽度: ${renderInfo.bodyWidth}px`);
    console.log(`${currentTime} - 高度: ${renderInfo.bodyHeight}px`);
    console.log(`${currentTime} - 文本长度: ${renderInfo.bodyContent} 字符`);
    console.log(`${currentTime} - Meta标签数量: ${renderInfo.metaTags}`);

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
  }
}

// 立即执行
detailedPageCheck().catch(error => console.error('访问失败:', error));
