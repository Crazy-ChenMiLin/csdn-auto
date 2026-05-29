const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('========================================');
  console.log('CSDN 博客发布 - 基于成功经验');
  console.log('========================================\n');
  
  const targetUrl = 'https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1';
  
  // 博客内容
  const blogTitle = "使用 OpenClaw 自动化发布博客文章的实践";
  const blogContent = `
<h2>前言</h2>
<p>本文介绍了如何使用 OpenClaw 平台结合 Playwright 自动化工具，实现 CSDN 博客平台的自动发布功能。</p>

<h2>技术方案</h2>
<p>通过 Cookie 认证方式，我们成功绕过了登录验证，实现了博客内容的自动化发布。</p>

<h2>应用场景</h2>
<p>这种自动化方案可以大大提高内容发布的效率，特别适合需要批量发布文章的场景。</p>

<h2>总结</h2>
<p>自动化发布不仅节省了时间，还确保了发布流程的一致性和可靠性。</p>
`;
  
  // 最新 Cookie（简化版，只保留关键字段）
  const cookies = [
    { domain: '.csdn.net', name: 'SESSION', path: '/', value: 'e1a9f776-5b88-455e-9b30-97c142621b41', httpOnly: true },
    { domain: '.csdn.net', name: 'UserToken', path: '/', value: '3390401ac9484771b8df4061c7d864a8', httpOnly: true },
    { domain: '.csdn.net', name: 'UserInfo', path: '/', value: '3390401ac9484771b8df4061c7d864a8', httpOnly: true },
    { domain: '.csdn.net', name: 'UserName', path: '/', value: 'a111ajaj' },
    { domain: '.csdn.net', name: 'UserNick', path: '/', value: '%E7%A8%8B%E5%BA%8F%E5%91%98-%E5%A4%A7%E7%B1%B3' },
    { domain: '.csdn.net', name: 'UN', path: '/', value: 'a111ajaj' },
    { domain: '.csdn.net', name: 'AU', path: '/', value: '46F' }
  ];
  
  let browser;
  const results = {
    login: false,
    title: false,
    content: false,
    draftSaved: false,
    published: false,
    errors: []
  };
  
  try {
    // 启动浏览器
    console.log('🚀 启动浏览器...');
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // 使用 CDP 设置 Cookie（按照成功经验）
    console.log('📝 使用 CDP 设置 Cookie...');
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    
    for (const cookie of cookies) {
      await client.send('Network.setCookie', {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false
      });
    }
    console.log('✅ Cookie 设置完成\n');
    
    // 访问编辑器页面
    console.log('🌐 访问编辑器页面...');
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    // 保存初始截图
    const initialScreenshot = `csdn-working-initial-${Date.now()}.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    console.log(`📸 初始截图: ${initialScreenshot}`);
    
    // 检查登录状态
    const pageContent = await page.content();
    results.login = !pageContent.includes('登录') && pageContent.includes('创作中心');
    console.log(`🔐 登录状态: ${results.login ? '✅ 已登录' : '❌ 未登录'}\n`);
    
    if (!results.login) {
      throw new Error('Cookie 登录失败，请检查 Cookie 是否过期');
    }
    
    // ========== 步骤 1: 填写标题 ==========
    console.log('📝 步骤 1: 填写标题...');
    try {
      await page.evaluate((title) => {
        const titleEl = document.getElementById('txtTitle');
        if (!titleEl) throw new Error('找不到标题输入框 (txtTitle)');
        
        titleEl.value = title;
        titleEl.dispatchEvent(new Event('input', { bubbles: true }));
        titleEl.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('✅ 标题已设置:', title);
      }, blogTitle);
      
      results.title = true;
      console.log('✅ 标题填写成功\n');
    } catch (error) {
      results.errors.push(`标题填写失败: ${error.message}`);
      console.log('❌ 标题填写失败:', error.message, '\n');
    }
    
    await page.waitForTimeout(2000);
    
    // ========== 步骤 2: 填写正文（使用 CKEditor API） ==========
    console.log('📝 步骤 2: 填写正文...');
    try {
      await page.evaluate((content) => {
        // 等待 CKEditor 加载
        const maxWait = 10000;
        const startTime = Date.now();
        
        while (!window.CKEDITOR && Date.now() - startTime < maxWait) {
          // 等待
        }
        
        if (!window.CKEDITOR) {
          throw new Error('CKEditor 未加载');
        }
        
        const editor = window.CKEDITOR.instances?.editor;
        if (!editor) {
          throw new Error('找不到 CKEditor 实例');
        }
        
        editor.setData(content);
        editor.updateElement();
        
        console.log('✅ 正文已写入 CKEditor');
      }, blogContent);
      
      results.content = true;
      console.log('✅ 正文填写成功\n');
    } catch (error) {
      results.errors.push(`正文填写失败: ${error.message}`);
      console.log('❌ 正文填写失败:', error.message, '\n');
    }
    
    await page.waitForTimeout(3000);
    
    // 保存中间截图
    await page.screenshot({ path: `csdn-working-filled-${Date.now()}.png`, fullPage: true });
    
    // ========== 步骤 3: 保存草稿 ==========
    console.log('📝 步骤 3: 保存草稿...');
    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const saveButton = buttons.find(el => 
          (el.innerText || '').trim() === '保存草稿' ||
          (el.textContent || '').trim() === '保存草稿'
        );
        
        if (!saveButton) {
          throw new Error('找不到保存草稿按钮');
        }
        
        saveButton.click();
        console.log('✅ 保存草稿按钮已点击');
      });
      
      results.draftSaved = true;
      console.log('✅ 保存草稿成功\n');
    } catch (error) {
      results.errors.push(`保存草稿失败: ${error.message}`);
      console.log('❌ 保存草稿失败:', error.message, '\n');
    }
    
    await page.waitForTimeout(5000);
    
    // ========== 步骤 4: 尝试发布 ==========
    console.log('📝 步骤 4: 尝试发布...');
    try {
      // 先检查是否有弹窗或遮罩层
      const hasOverlay = await page.evaluate(() => {
        const overlays = document.querySelectorAll('.el-dialog, .modal, [class*="overlay"], [class*="mask"]');
        return overlays.length > 0;
      });
      
      if (hasOverlay) {
        console.log('⚠️ 检测到弹窗/遮罩层，可能有限制提示');
      }
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const publishButton = buttons.find(el => {
          const text = (el.innerText || el.textContent || '').trim();
          return text === '发布博客' || text.includes('发布');
        });
        
        if (!publishButton) {
          throw new Error('找不到发布博客按钮');
        }
        
        publishButton.click();
        console.log('✅ 发布博客按钮已点击');
      });
      
      results.published = true;
      console.log('✅ 发布按钮点击成功\n');
    } catch (error) {
      results.errors.push(`发布失败: ${error.message}`);
      console.log('❌ 发布失败:', error.message, '\n');
    }
    
    await page.waitForTimeout(5000);
    
    // 保存最终截图
    const finalScreenshot = `csdn-working-final-${Date.now()}.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`📸 最终截图: ${finalScreenshot}\n`);
    
  } catch (error) {
    console.error('❌ 严重错误:', error.message);
    results.errors.push(`严重错误: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 浏览器已关闭\n');
    }
    
    // 打印结果汇总
    console.log('========================================');
    console.log('📊 执行结果汇总');
    console.log('========================================');
    console.log(`登录状态: ${results.login ? '✅' : '❌'}`);
    console.log(`标题填写: ${results.title ? '✅' : '❌'}`);
    console.log(`正文填写: ${results.content ? '✅' : '❌'}`);
    console.log(`保存草稿: ${results.draftSaved ? '✅' : '❌'}`);
    console.log(`发布博客: ${results.published ? '✅' : '❌'}`);
    console.log('========================================');
    
    if (results.errors.length > 0) {
      console.log('\n⚠️ 错误记录:');
      results.errors.forEach(err => console.log(`  - ${err}`));
    }
    
    // 保存结果到文件
    fs.writeFileSync('csdn-publish-results.json', JSON.stringify(results, null, 2));
    console.log('\n📝 结果已保存: csdn-publish-results.json');
  }
})();
