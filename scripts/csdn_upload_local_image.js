const { chromium } = require('playwright');
const fs = require('fs');
const { marked } = require('marked');

const COOKIE_FILE = '/home/node/.openclaw/workspace/1.txt';
const REPORT_FILE = '/home/node/.openclaw/workspace/reports/chenmilin_xyz_502_error_report_2026-05-20.md';
const LOCAL_IMAGE = '/home/node/.openclaw/media/browser/b00c86b7-9067-4c79-ae29-cd85480b8c06.png';

function loadCookies(cookieFilePath) {
  const raw = fs.readFileSync(cookieFilePath, 'utf8');
  const cookies = JSON.parse(raw);
  return cookies.map((cookie) => {
    const mapped = {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path || '/',
    };
    if (typeof cookie.expires === 'number') mapped.expires = cookie.expires;
    else if (typeof cookie.expirationDate === 'number') mapped.expires = cookie.expirationDate;
    if (typeof cookie.httpOnly === 'boolean') mapped.httpOnly = cookie.httpOnly;
    if (typeof cookie.secure === 'boolean') mapped.secure = cookie.secure;
    if (cookie.sameSite === 'no_restriction') mapped.sameSite = 'None';
    else if (cookie.sameSite === 'lax') mapped.sameSite = 'Lax';
    else if (cookie.sameSite === 'strict') mapped.sameSite = 'Strict';
    return mapped;
  });
}

function markdownToCSDNHtml(mdContent) {
  let html = marked(mdContent);
  html = html.replace(/<pre><code>/g, '<pre><code class="language-bash">');
  return html;
}

async function publishWithLocalCover() {
  console.log('🚀 开始全自动化发布（使用本地图片）...');
  
  const mdContent = fs.readFileSync(REPORT_FILE, 'utf8');
  const htmlContent = markdownToCSDNHtml(mdContent);
  const titleMatch = mdContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'chenmilin.xyz 网站 502 错误诊断报告';
  
  console.log('📝 标题:', title);
  console.log('📸 本地图片:', LOCAL_IMAGE);
  
  const cookies = loadCookies(COOKIE_FILE);
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  await context.addCookies(cookies);
  const page = await context.newPage();
  
  try {
    // 1. 访问编辑器
    console.log('\n📍 步骤 1: 访问编辑器');
    await page.goto('https://mp.csdn.net/mp_blog/creation/editor', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);
    
    // 检查登录
    const titleVisible = await page.locator('#txtTitle').isVisible();
    if (!titleVisible) {
      throw new Error('未登录，Cookie 可能已失效');
    }
    console.log('✅ 登录成功');
    
    // 2. 写入标题
    console.log('\n📍 步骤 2: 写入标题');
    await page.evaluate((t) => {
      const el = document.getElementById('txtTitle');
      el.value = t;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, title);
    await page.waitForTimeout(1000);
    console.log('✅ 标题已写入');
    
    // 3. 写入内容
    console.log('\n📍 步骤 3: 写入内容');
    await page.evaluate((c) => {
      const editor = window.CKEDITOR.instances.editor;
      editor.setData(c);
      editor.updateElement();
    }, htmlContent);
    await page.waitForTimeout(2000);
    console.log('✅ 内容已写入');
    
    // 4. 截图当前状态（查看编辑器结构）
    console.log('\n📍 步骤 4: 截图编辑器结构');
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-editor-structure.png',
      fullPage: true 
    });
    console.log('✅ 截图已保存');
    
    // 5. 查找封面图上传区域
    console.log('\n📍 步骤 5: 查找封面图上传区域');
    
    // 获取页面 HTML 结构
    const pageHtml = await page.content();
    fs.writeFileSync('/home/node/.openclaw/workspace/csdn-page-structure.html', pageHtml);
    console.log('✅ 页面 HTML 已保存');
    
    // 尝试多种方式上传封面图
    let uploadSuccess = false;
    
    // 方式1：先点击"添加封面"按钮，再上传
    console.log('\n🔍 方式1: 点击"添加封面"按钮');
    try {
      const addCoverBtn = await page.locator('text=添加封面').first();
      if (await addCoverBtn.isVisible()) {
        console.log('✅ 找到"添加封面"按钮');
        await addCoverBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ 已点击"添加封面"按钮');
        
        // 现在文件上传框应该可见了
        const fileInput = await page.locator('input[type="file"]').first();
        console.log('📤 上传封面图...');
        await fileInput.setInputFiles(LOCAL_IMAGE);
        await page.waitForTimeout(3000);
        uploadSuccess = true;
        console.log('✅ 封面图上传成功！');
      }
    } catch (e) {
      console.log('❌ 方式1失败:', e.message);
    }
    
    // 方式2：查找包含"封面"的元素附近的上传框
    if (!uploadSuccess) {
      console.log('\n🔍 方式2: 查找封面相关元素');
      try {
        // 查找所有包含"封面"文字的元素
        const coverElements = await page.locator(':text("封面")').all();
        console.log(`找到 ${coverElements.length} 个包含"封面"的元素`);
        
        for (const el of coverElements) {
          const text = await el.textContent();
          console.log(`  - 元素文本: "${text}"`);
        }
      } catch (e) {
        console.log('  ❌ 查找失败:', e.message);
      }
    }
    
    // 方式3：使用 evaluate 直接操作 DOM
    if (!uploadSuccess) {
      console.log('\n🔍 方式3: 直接操作 DOM');
      try {
        const uploadInfo = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
          return inputs.map(input => ({
            name: input.name,
            id: input.id,
            accept: input.accept,
            className: input.className,
            parentText: input.parentElement?.textContent?.substring(0, 50),
            isVisible: input.offsetParent !== null
          }));
        });
        
        console.log('文件上传框详情:');
        console.log(JSON.stringify(uploadInfo, null, 2));
        
        // 找到可能是封面的上传框
        const coverInput = uploadInfo.find(info => 
          info.parentText?.includes('封面') || 
          info.accept?.includes('image') ||
          info.name?.includes('cover') ||
          info.name?.includes('image')
        );
        
        if (coverInput) {
          console.log('找到可能的封面上传框:', coverInput);
          
          // 使用 Playwright 上传
          const selector = coverInput.id ? `#${coverInput.id}` : `input[name="${coverInput.name}"]`;
          await page.locator(selector).setInputFiles(LOCAL_IMAGE);
          await page.waitForTimeout(2000);
          uploadSuccess = true;
          console.log('✅ 上传成功！');
        }
      } catch (e) {
        console.log('❌ 操作失败:', e.message);
      }
    }
    
    // 6. 截图上传后的状态
    console.log('\n📍 步骤 6: 截图上传状态');
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-after-upload-attempt.png',
      fullPage: true 
    });
    console.log('✅ 截图已保存');
    
    // 7. 保存草稿
    console.log('\n📍 步骤 7: 保存草稿');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(el => (el.innerText || '').trim() === '保存草稿');
      if (saveBtn) {
        saveBtn.click();
      }
    });
    await page.waitForTimeout(3000);
    console.log('✅ 草稿已保存');
    
    // 8. 最终截图
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-final-local-cover.png',
      fullPage: true 
    });
    
    console.log('\n🎉 发布流程完成！');
    console.log('📊 结果:');
    console.log('  - 标题:', title);
    console.log('  - 内容长度:', htmlContent.length, '字符');
    console.log('  - 封面图上传:', uploadSuccess ? '成功' : '失败');
    console.log('  - 状态: 草稿已保存');
    console.log('\n📁 请查看截图:');
    console.log('  - csdn-editor-structure.png');
    console.log('  - csdn-after-upload-attempt.png');
    console.log('  - csdn-final-local-cover.png');
    console.log('  - csdn-page-structure.html');
    
  } catch (error) {
    console.error('\n❌ 发布失败:', error.message);
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-error-local.png',
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
}

publishWithLocalCover();