const { chromium } = require('playwright');

async function checkPublishPage() {
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
    console.log(`${currentTime} - 开始访问小红书创作者后台发布页面 ${url}`);
    
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

    // 访问页面
    const response = await page.goto(url, {
      timeout: 60000,
      waitUntil: 'load'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待更长时间让页面完全加载
    await page.waitForTimeout(5000);

    // 保存页面截图
    await page.screenshot({ 
      path: `publish-page-check-${currentTime.replace(/[:.]/g, '-')}.png`,
      fullPage: true
    });

    // 获取页面HTML内容
    const pageContent = await page.content();
    
    // 检查是否有上传相关的元素
    console.log(`${currentTime} - 检查上传相关元素`);
    
    const uploadSelectors = [
      'input[type="file"]',
      'input[name="file"]',
      'input[accept="image/*"]',
      '.upload-btn',
      '.file-input',
      'button[type="file"]',
      '[data-testid="upload-button"]',
      '.upload-container',
      '.file-picker'
    ];

    for (const selector of uploadSelectors) {
      try {
        const elements = await page.$$(selector);
        console.log(`${currentTime} - 选择器 ${selector}: ${elements.length} 个元素`);
        
        if (elements.length > 0) {
          // 尝试获取文件输入框
          if (selector.includes('input')) {
            await page.screenshot({
              path: `upload-element-${selector.replace(/[:.]/g, '-')}-${currentTime.replace(/[:.]/g, '-')}.png`,
              clip: await elements[0].boundingBox()
            });
          }
        }
      } catch (error) {
        console.log(`${currentTime} - 检查选择器 ${selector} 时出错: ${error.message}`);
      }
    }

    // 检查页面是否有任何交互元素
    const interactiveElements = await page.$$('button, input, select, textarea');
    console.log(`${currentTime} - 交互元素数量: ${interactiveElements.length}`);

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
  }
}

// 立即执行
checkPublishPage().catch(error => console.error('访问失败:', error));
