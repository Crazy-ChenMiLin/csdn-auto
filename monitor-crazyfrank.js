const { chromium } = require('playwright');
const fs = require('fs');

async function monitorWebsite() {
  const url = 'https://www.crazyfrank.top/zh/page/2/';
  const logFile = 'monitor-crazyfrank.log';
  const currentTime = new Date().toISOString();

  try {
    console.log(`${currentTime} - 开始监控 ${url}`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    // 访问网站
    const startTime = Date.now();
    const response = await page.goto(url, {
      timeout: 30000,
      waitUntil: 'domcontentloaded'
    });
    const loadTime = Date.now() - startTime;

    if (!response || response.status() !== 200) {
      const errorMessage = `${currentTime} - 访问失败，状态码: ${response?.status() || '无响应'}`;
      console.error(errorMessage);
      fs.appendFileSync(logFile, errorMessage + '\n');
      await browser.close();
      return;
    }

    console.log(`${currentTime} - 访问成功，状态码: ${response.status()}`);
    console.log(`${currentTime} - 加载时间: ${loadTime}ms`);

    // 检查页面标题
    const title = await page.title();
    console.log(`${currentTime} - 页面标题: ${title}`);

    // 检查文章列表是否存在
    const hasArticleList = await page.evaluate(() => {
      return document.querySelectorAll('article.single.summary').length > 0;
    });

    if (hasArticleList) {
      console.log(`${currentTime} - 文章列表加载正常`);
    } else {
      console.log(`${currentTime} - 警告: 文章列表未找到`);
    }

    // 检查文章数量
    const postCount = await page.evaluate(() => {
      return document.querySelectorAll('article.single.summary').length;
    });

    console.log(`${currentTime} - 文章数量: ${postCount}`);

    // 获取每篇文章的标题和链接
    const articles = await page.evaluate(() => {
      const items = document.querySelectorAll('article.single.summary');
      return Array.from(items).map(item => ({
        title: item.querySelector('.single-title').textContent.trim(),
        link: item.querySelector('.single-title a').href
      }));
    });

    if (articles.length > 0) {
      console.log(`${currentTime} - 文章列表:`);
      articles.forEach((article, index) => {
        console.log(`${currentTime} - ${index + 1}. ${article.title}: ${article.link}`);
      });
    }

    // 检查分页信息
    const pagination = await page.evaluate(() => {
      const pages = document.querySelectorAll('.pagination .page-item');
      const currentPage = document.querySelector('.pagination .page-item.active');
      
      return {
        totalPages: pages.length,
        currentPage: currentPage ? parseInt(currentPage.textContent.trim()) : 0
      };
    });

    console.log(`${currentTime} - 分页信息: 第 ${pagination.currentPage} 页，共 ${pagination.totalPages} 页`);

    // 保存截图（可选）
    await page.screenshot({ 
      path: `screenshot-${currentTime.replace(/[:.]/g, '-')}.png`,
      fullPage: true
    });

    // 记录成功信息
    const successMessage = `${currentTime} - 访问成功,状态码:${response.status()},加载时间:${loadTime}ms,标题:${title},文章数量:${postCount},分页:第${pagination.currentPage}页/共${pagination.totalPages}页`;
    fs.appendFileSync(logFile, successMessage + '\n');

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 监控失败: ${error.message}`;
    console.error(errorMessage);
    fs.appendFileSync(logFile, errorMessage + '\n');
  }
}

// 立即执行一次监控
monitorWebsite().catch(error => console.error('监控失败:', error));

// 导出函数，供定时任务调用
module.exports = monitorWebsite;
