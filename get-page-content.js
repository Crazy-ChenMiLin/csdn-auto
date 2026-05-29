const { chromium } = require('playwright');

async function getPageContent() {
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
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: false
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

    // 获取页面HTML内容
    const pageContent = await page.content();
    
    // 保存HTML内容到文件
    const fs = require('fs');
    const fileName = `page-content-${currentTime.replace(/[:.]/g, '-')}.html`;
    fs.writeFileSync(fileName, pageContent);
    console.log(`${currentTime} - 页面HTML内容已保存到: ${fileName}`);

    // 查找与文件上传相关的HTML内容
    const uploadRelatedContent = [];
    const uploadPatterns = [
      /input.*type.*file/i,
      /file.*upload/i,
      /upload.*file/i,
      /class.*upload/i,
      /id.*upload/i,
      /data.*upload/i,
      /file.*picker/i,
      /openFilePicker/i
    ];
    
    const lines = pageContent.split('\n');
    lines.forEach((line, index) => {
      for (const pattern of uploadPatterns) {
        if (pattern.test(line)) {
          uploadRelatedContent.push(`Line ${index + 1}: ${line.trim()}`);
        }
      }
    });
    
    console.log(`${currentTime} - 找到的上传相关内容:`);
    if (uploadRelatedContent.length > 0) {
      uploadRelatedContent.forEach(line => console.log(line));
    } else {
      console.log('未找到直接与文件上传相关的内容');
    }

    // 获取页面可见文本
    const visibleText = await page.evaluate(() => {
      return document.body.innerText;
    });
    
    console.log(`${currentTime} - 页面可见文本:`);
    if (visibleText.trim()) {
      // 只显示前2000个字符
      console.log(visibleText.trim().substring(0, 2000));
    } else {
      console.log('页面没有可见文本');
    }

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
  }
}

// 立即执行
getPageContent().catch(error => console.error('访问失败:', error));
