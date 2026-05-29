const { chromium } = require('playwright');

async function tryDifferentConfig() {
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
    console.log(`${currentTime} - 尝试不同浏览器配置访问 ${url}`);
    
    const browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-features=VizDisplayCompositor']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    // 设置Cookie
    await context.addCookies(cookies);
    
    const page = await context.newPage();

    // 访问页面
    const response = await page.goto(url, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待更长时间让页面完全加载
    await page.waitForTimeout(15000);

    // 检查页面内容
    const pageContent = await page.content();
    console.log(`${currentTime} - 页面HTML长度: ${pageContent.length} 字符`);

    // 检查是否有可见内容
    const visibleContent = await page.evaluate(() => {
      return document.body.innerText.trim().length;
    });
    console.log(`${currentTime} - 可见文本长度: ${visibleContent} 字符`);

    // 检查页面尺寸
    const dimensions = await page.evaluate(() => {
      return {
        width: document.body.clientWidth,
        height: document.body.clientHeight,
        scrollHeight: document.body.scrollHeight
      };
    });
    console.log(`${currentTime} - 页面尺寸: ${dimensions.width}x${dimensions.height} (scroll: ${dimensions.scrollHeight})`);

    // 保存页面截图
    await page.screenshot({ 
      path: `different-config-${currentTime.replace(/[:.]/g, '-')}.png`,
      fullPage: true
    });

    // 检查是否有文件上传元素
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log(`${currentTime} - 找到文件上传元素!`);
    } else {
      console.log(`${currentTime} - 未找到文件上传元素`);
    }

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
  }
}

// 立即执行
tryDifferentConfig().catch(error => console.error('访问失败:', error));
