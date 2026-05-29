const { chromium } = require('playwright');

async function checkUploadElements() {
  const publishUrl = 'https://creator.xiaohongshu.com/publish/publish?from=homepage&target=image&openFilePicker=true';
  const currentTime = new Date().toISOString();

  try {
    console.log(`${currentTime} - 检查发布页面上传相关元素 ${publishUrl}`);
    
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
      path: `upload-elements-check-${currentTime.replace(/[:.]/g, '-')}.png`,
      fullPage: true
    });

    // 尝试找到文件上传相关元素
    const uploadBtn = await page.$('.upload-btn');
    const inputFile = await page.$('.input-file');
    
    if (uploadBtn) {
      console.log(`${currentTime} - 找到上传按钮元素`);
      
      const uploadBtnText = await page.evaluate(el => el.textContent.trim(), uploadBtn);
      console.log(`${currentTime} - 上传按钮文本: "${uploadBtnText}"`);
      
      // 获取上传按钮的属性
      const uploadBtnAttrs = await page.evaluate(el => {
        const attrs = {};
        el.getAttributeNames().forEach(name => {
          attrs[name] = el.getAttribute(name);
        });
        return attrs;
      }, uploadBtn);
      
      console.log(`${currentTime} - 上传按钮属性:`, uploadBtnAttrs);
      
    } else {
      console.log(`${currentTime} - 未找到.upload-btn元素`);
    }
    
    if (inputFile) {
      console.log(`${currentTime} - 找到.input-file元素`);
      
      // 获取文件输入元素的属性
      const inputFileAttrs = await page.evaluate(el => {
        const attrs = {};
        el.getAttributeNames().forEach(name => {
          attrs[name] = el.getAttribute(name);
        });
        return attrs;
      }, inputFile);
      
      console.log(`${currentTime} - 文件输入元素属性:`, inputFileAttrs);
      
    } else {
      console.log(`${currentTime} - 未找到.input-file元素`);
    }

    // 检查iframe
    const iframe = await page.$('iframe');
    if (iframe) {
      console.log(`${currentTime} - 找到iframe元素`);
      
      try {
        // 获取iframe的src
        const iframeSrc = await page.evaluate(el => el.getAttribute('src'), iframe);
        console.log(`${currentTime} - iframe src: ${iframeSrc}`);
        
      } catch (error) {
        console.log(`${currentTime} - 访问iframe时出错: ${error.message}`);
      }
    }

    // 输出页面的所有类名（用于分析）
    try {
      const allClasses = await page.evaluate(() => {
        const classes = new Set();
        document.querySelectorAll('*').forEach(el => {
          if (el.className && typeof el.className === 'string') {
            el.className.split(' ').forEach(cls => {
              if (cls) classes.add(cls);
            });
          }
        });
        return Array.from(classes);
      });
      
      console.log(`${currentTime} - 页面所有类名数量: ${allClasses.length}`);
      
      // 过滤与上传相关的类名
      const uploadRelatedClasses = allClasses.filter(cls => 
        cls.includes('upload') || 
        cls.includes('file') || 
        cls.includes('picker') || 
        cls.includes('img')
      );
      
      console.log(`${currentTime} - 与上传相关的类名:`, uploadRelatedClasses);
      
    } catch (error) {
      console.log(`${currentTime} - 获取类名时出错: ${error.message}`);
    }

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
checkUploadElements().catch(error => console.error('访问失败:', error));
