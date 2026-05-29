const { chromium } = require('playwright');
const fs = require('fs');

async function checkDouyinWorks() {
  const targetUrl = 'https://creator.douyin.com/creator-micro/content/manage';
  const currentTime = new Date().toISOString();

  // 使用成功访问过的Cookie信息
  const cookies = [
    {
      "name": "__security_server_data_status",
      "value": "1",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1783225370.249341,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "sessionid",
      "value": "acbe0245f71fd900f4783665c5b7ae18",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1783225369.573804,
      "httpOnly": true,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "ttwid",
      "value": "1%7CSnkbKk0i2nSjS_L51m7q5XJT7muyeHyq9AYAmM5rz3I%7C1778041368%7Cff92dd472fe0f3f55f9a66f2cf188ca3ba7118042fee88d1b08255f6a2effa69",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1809577376.930242,
      "httpOnly": true,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "passport_csrf_token",
      "value": "b51b888bd168593833e6b0c3408820db",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1783225295.716838,
      "httpOnly": false,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "csrf_session_id",
      "value": "9ac1e5b8599e8387a1793925bea1bb9e",
      "domain": "creator.douyin.com",
      "path": "/",
      "expires": 0,
      "httpOnly": false,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "d_ticket",
      "value": "230653f064bcedc38554b38bd789e75fd95c7",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1809577368.866497,
      "httpOnly": true,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "x-web-secsdk-uid",
      "value": "4da56938-568e-47f7-99e1-e0e23605d345",
      "domain": "creator.douyin.com",
      "path": "/",
      "expires": 0,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    }
  ];

  try {
    console.log(`${currentTime} - 开始检查抖音作品管理页面 ${targetUrl}`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: false
    });
    
    await context.addCookies(cookies);
    
    const page = await context.newPage();

    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待页面加载完成
    await page.waitForTimeout(8000);

    // 保存页面截图
    const screenshotPath = `douyin-works-manage-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`${currentTime} - 作品管理页面截图已保存: ${screenshotPath}`);

    // 获取页面可见文本检查是否有发布的作品
    const visibleText = await page.textContent('body');
    console.log(`${currentTime} - 页面可见文本前1000字符: ${visibleText.substring(0, 1000)}`);

    // 检查是否包含测试内容
    if (visibleText.includes('测试标题') || visibleText.includes('测试内容')) {
      console.log(`${currentTime} - 找到测试内容的作品`);
    } else {
      console.log(`${currentTime} - 未找到包含测试内容的作品`);
    }

    // 检查是否有作品列表
    const worksListSelectors = [
      '.works-list',
      '.content-list',
      '[data-type="work-item"]',
      '.work-card'
    ];

    let worksFound = false;
    for (const selector of worksListSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`${currentTime} - 找到作品列表，共 ${elements.length} 个作品，使用选择器: ${selector}`);
          worksFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!worksFound) {
      console.log(`${currentTime} - 未找到作品列表，可能是页面结构不同`);
    }

    // 检查是否有状态筛选
    const statusSelectors = [
      'select[name*="status"]',
      '[data-filter*="status"]',
      '.status-filter'
    ];

    for (const selector of statusSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          const value = await elements[0].evaluate(el => el.value || el.textContent);
          console.log(`${currentTime} - 找到状态筛选: ${selector}，当前值: ${value}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // 检查作品状态
    const statusOptions = ['全部', '草稿', '待审核', '已发布', '已驳回'];
    for (const status of statusOptions) {
      if (visibleText.includes(status)) {
        console.log(`${currentTime} - 页面包含状态: ${status}`);
      }
    }

    await browser.close();
    console.log(`${currentTime} - 任务完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
  }
}

checkDouyinWorks().catch(error => console.error('任务失败:', error));
