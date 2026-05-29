const { chromium } = require('playwright');

async function getPageDetails() {
  const publishUrl = 'https://creator.xiaohongshu.com/publish/publish?from=homepage&target=image&openFilePicker=true';
  const currentTime = new Date().toISOString();

  try {
    console.log(`${currentTime} - 访问发布页面获取详细信息 ${publishUrl}`);
    
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

    // 直接访问发布页面
    const response = await page.goto(publishUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 发布页面访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待页面加载完成
    await page.waitForTimeout(5000);

    // 保存完整页面截图
    await page.screenshot({ 
      path: `page-details-${currentTime.replace(/[:.]/g, '-')}.png`,
      fullPage: true
    });

    // 获取页面的详细HTML内容
    const htmlContent = await page.content();
    
    // 保存HTML到文件
    const fs = require('fs');
    const fileName = `page-details-${currentTime.replace(/[:.]/g, '-')}.html`;
    fs.writeFileSync(fileName, htmlContent);
    console.log(`${currentTime} - 页面HTML内容已保存到: ${fileName}`);

    // 查找与文件上传相关的内容
    const uploadPatterns = [
      /upload/i,
      /file.*upload/i,
      /upload.*file/i,
      /openFilePicker/i,
      /file.*picker/i,
      /选择.*文件/i,
      /上传.*文件/i,
      /文件.*上传/i,
      /文件.*选择/i
    ];
    
    console.log(`${currentTime} - 搜索与文件上传相关的内容:`);
    
    uploadPatterns.forEach(pattern => {
      const matches = htmlContent.match(pattern);
      if (matches) {
        console.log(`${currentTime} - 找到匹配模式: ${pattern}`);
        
        // 找到匹配模式周围的50个字符
        const index = htmlContent.indexOf(matches[0]);
        const start = Math.max(0, index - 25);
        const end = Math.min(htmlContent.length, index + 25);
        const context = htmlContent.substring(start, end);
        console.log(`${currentTime} - 匹配上下文: ${context}`);
      }
    });

    // 查找可能的Vue组件或动态加载内容的线索
    if (htmlContent.includes('openFilePicker') || htmlContent.includes('target=image')) {
      console.log(`${currentTime} - 找到openFilePicker或target=image参数`);
    }

    // 获取页面所有button和可点击元素的文本
    const buttons = await page.$$('button');
    console.log(`${currentTime} - 找到 ${buttons.length} 个按钮`);
    
    for (let i = 0; i < Math.min(20, buttons.length); i++) {
      const buttonText = await page.evaluate(el => el.textContent.trim(), buttons[i]);
      if (buttonText.length > 0) {
        console.log(`${currentTime} - 按钮 ${i + 1}: "${buttonText}"`);
      }
    }

    // 检查页面是否有iframe或动态加载内容的线索
    const iframes = await page.$$('iframe');
    console.log(`${currentTime} - 找到 ${iframes.length} 个iframe`);
    
    iframes.forEach((iframe, index) => {
      iframe.evaluate(el => {
        console.log(`Iframe ${index}: src=${el.src}`);
      });
    });

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
    if (error.stack) {
      console.error(error.stack.slice(0, 200));
    }
  }
}

// 立即执行
getPageDetails().catch(error => console.error('访问失败:', error));
