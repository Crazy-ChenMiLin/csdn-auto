const { chromium } = require('playwright');
const fs = require('fs');

// 配置
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;
const EXECUTION_LOG = [];

function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry);
  EXECUTION_LOG.push(logEntry);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryFindAndFill(page, selectors, value, description) {
  for (let i = 0; i < selectors.length; i++) {
    try {
      log(`尝试 ${description} 选择器 ${i + 1}/${selectors.length}: ${selectors[i]}`);
      const element = await page.locator(selectors[i]).first();
      await element.waitFor({ timeout: 5000 });
      await element.fill(value);
      log(`✅ ${description} 填写成功`);
      return true;
    } catch (error) {
      log(`❌ 选择器 ${i + 1} 失败: ${error.message}`);
    }
  }
  return false;
}

async function tryFindAndClick(page, selectors, description) {
  for (let i = 0; i < selectors.length; i++) {
    try {
      log(`尝试 ${description} 点击选择器 ${i + 1}/${selectors.length}: ${selectors[i]}`);
      const element = await page.locator(selectors[i]).first();
      await element.waitFor({ timeout: 5000 });
      await element.click();
      log(`✅ ${description} 点击成功`);
      return true;
    } catch (error) {
      log(`❌ 点击选择器 ${i + 1} 失败: ${error.message}`);
    }
  }
  return false;
}

async function executeAttempt(attemptNumber) {
  log(`\n========== 第 ${attemptNumber}/${MAX_RETRIES} 次尝试 ==========`);
  
  const targetUrl = 'https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1&spm=1011.2415.3001.6192';
  const blogTitle = "使用 OpenClaw 自动化发布博客文章的实践";
  const blogContent = "本文介绍了如何使用 OpenClaw 平台结合 Playwright 自动化工具，实现 CSDN 博客平台的自动发布功能。通过 Cookie 认证方式，我们成功绕过了登录验证，实现了博客内容的自动化发布。这种自动化方案可以大大提高内容发布的效率，特别适合需要批量发布文章的场景。";
  const blogTag = "人工智能";
  
  const cookies = [
    { "name": "UserToken", "value": "3390401ac9484771b8df4061c7d864a8", "domain": ".csdn.net", "path": "/", "httpOnly": true, "secure": false, "sameSite": "Lax" },
    { "name": "SESSION", "value": "4be2b3be-dcc7-429e-a1c5-0e3b8f841943", "domain": ".csdn.net", "path": "/", "httpOnly": true, "secure": false, "sameSite": "Lax" },
    { "name": "UserName", "value": "a111ajaj", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "UN", "value": "a111ajaj", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" },
    { "name": "UserInfo", "value": "3390401ac9484771b8df4061c7d864a8", "domain": ".csdn.net", "path": "/", "httpOnly": true, "secure": false, "sameSite": "Lax" },
    { "name": "UserNick", "value": "%E7%A8%8B%E5%BA%8F%E5%91%98-%E5%A4%A7%E7%B1%B3", "domain": ".csdn.net", "path": "/", "httpOnly": false, "secure": false, "sameSite": "Lax" }
  ];

  let browser, context, page;
  const attemptResults = {
    attemptNumber,
    pageLoaded: false,
    titleFilled: false,
    contentFilled: false,
    tagSelected: false,
    publishClicked: false,
    errors: []
  };

  try {
    // 启动浏览器
    log('启动浏览器...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    await context.addCookies(cookies);
    page = await context.newPage();

    // 访问页面
    log(`访问 ${targetUrl}`);
    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    
    if (response?.status() !== 200) {
      throw new Error(`页面加载失败，状态码: ${response?.status()}`);
    }
    
    attemptResults.pageLoaded = true;
    log('✅ 页面加载成功');

    // 等待页面完全加载
    log('等待页面完全加载...');
    await sleep(15000);

    // 截图查看页面状态
    const initialScreenshot = `attempt-${attemptNumber}-initial.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    log(`📸 初始截图已保存: ${initialScreenshot}`);

    // 尝试填写标题 - 多种选择器策略
    log('\n--- 步骤1: 填写标题 ---');
    const titleSelectors = [
      'input[placeholder*="标题"]',
      'input[name*="title"]',
      'input[class*="title"]',
      '[data-testid*="title"]',
      'input[type="text"]',
      '.title-input input',
      '.blog-title input',
      'div[contenteditable="true"]',
      '[role="textbox"]'
    ];
    attemptResults.titleFilled = await tryFindAndFill(page, titleSelectors, blogTitle, '标题');

    if (!attemptResults.titleFilled) {
      attemptResults.errors.push('所有标题选择器均失败');
    }

    await sleep(3000);

    // 尝试填写内容
    log('\n--- 步骤2: 填写内容 ---');
    const contentSelectors = [
      'textarea[placeholder*="内容"]',
      'textarea[name*="content"]',
      'textarea[class*="content"]',
      '[contenteditable="true"]',
      '.editor-content',
      '.blog-content',
      '[data-testid*="content"]',
      'div[role="textbox"]',
      '.CodeMirror textarea',
      '.md-editor textarea'
    ];
    attemptResults.contentFilled = await tryFindAndFill(page, contentSelectors, blogContent, '内容');

    if (!attemptResults.contentFilled) {
      attemptResults.errors.push('所有内容选择器均失败');
    }

    await sleep(3000);

    // 尝试选择标签
    log('\n--- 步骤3: 选择标签 ---');
    const tagSelectors = [
      'input[placeholder*="标签"]',
      '.tag-input input',
      '[data-testid*="tag"]',
      'input[class*="tag"]'
    ];
    
    let tagSuccess = false;
    for (let i = 0; i < tagSelectors.length; i++) {
      try {
        log(`尝试标签选择器 ${i + 1}/${tagSelectors.length}: ${tagSelectors[i]}`);
        const tagInput = await page.locator(tagSelectors[i]).first();
        await tagInput.waitFor({ timeout: 5000 });
        await tagInput.fill(blogTag);
        await sleep(1000);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        log('✅ 标签选择成功');
        tagSuccess = true;
        break;
      } catch (error) {
        log(`❌ 标签选择器 ${i + 1} 失败: ${error.message}`);
      }
    }
    attemptResults.tagSelected = tagSuccess;
    
    if (!tagSuccess) {
      attemptResults.errors.push('所有标签选择器均失败');
    }

    await sleep(2000);

    // 尝试点击发布按钮
    log('\n--- 步骤4: 点击发布 ---');
    const publishSelectors = [
      'button:has-text("发布")',
      'button:has-text("发表")',
      'button:has-text("提交")',
      '.publish-btn',
      '[data-testid*="publish"]',
      'button[class*="publish"]',
      'button[type="submit"]'
    ];
    attemptResults.publishClicked = await tryFindAndClick(page, publishSelectors, '发布按钮');

    if (!attemptResults.publishClicked) {
      attemptResults.errors.push('所有发布按钮选择器均失败');
    }

    await sleep(5000);

    // 最终截图
    const finalScreenshot = `attempt-${attemptNumber}-final.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    log(`📸 最终截图已保存: ${finalScreenshot}`);

    await browser.close();
    log(`✅ 第 ${attemptNumber} 次尝试完成`);

    return attemptResults;

  } catch (error) {
    log(`❌ 第 ${attemptNumber} 次尝试发生错误: ${error.message}`);
    attemptResults.errors.push(`致命错误: ${error.message}`);
    
    if (page) {
      try {
        const errorScreenshot = `attempt-${attemptNumber}-error.png`;
        await page.screenshot({ path: errorScreenshot, fullPage: true });
        log(`📸 错误截图已保存: ${errorScreenshot}`);
      } catch (screenshotError) {
        log(`❌ 错误截图保存失败: ${screenshotError.message}`);
      }
    }
    
    if (browser) {
      await browser.close();
    }
    
    return attemptResults;
  }
}

async function main() {
  log('========================================');
  log('CSDN 博客发布自动化 - 改进版 v2');
  log(`最大重试次数: ${MAX_RETRIES}`);
  log('========================================\n');

  const allResults = [];
  let success = false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await executeAttempt(attempt);
    allResults.push(result);
    
    // 检查是否全部成功
    if (result.pageLoaded && result.titleFilled && result.contentFilled && result.tagSelected && result.publishClicked) {
      log(`\n🎉 第 ${attempt} 次尝试成功！所有步骤完成。`);
      success = true;
      break;
    }
    
    if (attempt < MAX_RETRIES) {
      log(`\n⏳ 等待 ${RETRY_DELAY}ms 后进行下一次尝试...`);
      await sleep(RETRY_DELAY);
    }
  }

  // 生成最终报告
  log('\n========================================');
  log('执行结果汇总');
  log('========================================');
  
  let successCount = 0;
  allResults.forEach((result, index) => {
    const attemptNum = index + 1;
    const status = (result.pageLoaded && result.titleFilled && result.contentFilled && result.tagSelected && result.publishClicked) ? '✅ 成功' : '❌ 失败';
    log(`\n尝试 ${attemptNum}: ${status}`);
    log(`  - 页面加载: ${result.pageLoaded ? '✅' : '❌'}`);
    log(`  - 标题填写: ${result.titleFilled ? '✅' : '❌'}`);
    log(`  - 内容填写: ${result.contentFilled ? '✅' : '❌'}`);
    log(`  - 标签选择: ${result.tagSelected ? '✅' : '❌'}`);
    log(`  - 发布点击: ${result.publishClicked ? '✅' : '❌'}`);
    if (result.errors.length > 0) {
      log(`  - 错误: ${result.errors.join(', ')}`);
    }
    
    if (result.pageLoaded && result.titleFilled && result.contentFilled && result.tagSelected && result.publishClicked) {
      successCount++;
    }
  });

  log(`\n========================================`);
  log(`总体结果: ${successCount}/${MAX_RETRIES} 次尝试完全成功`);
  log(`========================================`);

  // 保存日志
  const logContent = EXECUTION_LOG.join('\n');
  fs.writeFileSync('csdn-publish-execution-log.txt', logContent);
  log('\n📝 执行日志已保存到: csdn-publish-execution-log.txt');

  // 如果全部失败，生成失败分析报告
  if (!success) {
    log('\n========================================');
    log('失败原因分析');
    log('========================================');
    log('1. 页面结构问题:');
    log('   - CSDN 编辑器可能使用了自定义组件库');
    log('   - 元素可能被封装在 iframe 或 shadow DOM 中');
    log('   - 动态加载导致元素在页面加载后才出现');
    log('\n2. 可能的解决方案:');
    log('   - 使用浏览器开发者工具检查实际 DOM 结构');
    log('   - 增加更长的等待时间');
    log('   - 尝试通过 JavaScript 直接操作 DOM');
    log('   - 检查是否有反爬虫机制阻止自动化操作');
    log('\n3. 建议:');
    log('   - 查看保存的截图了解页面实际状态');
    log('   - 手动检查 CSDN 编辑器的 HTML 结构');
    log('   - 考虑使用 CSDN 提供的官方 API（如果有）');
  }
}

main().catch(error => {
  console.error('程序执行失败:', error);
  process.exit(1);
});
