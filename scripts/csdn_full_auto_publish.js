const { chromium } = require('playwright');
const fs = require('fs');
const { marked } = require('marked');

const COOKIE_FILE = '/home/node/.openclaw/workspace/1.txt';
const REPORT_FILE = '/home/node/.openclaw/workspace/reports/chenmilin_xyz_502_error_report_2026-05-20.md';

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

async function publishWithAutoCover(coverImageUrl) {
  console.log('🚀 开始全自动化发布到 CSDN...');
  console.log('📸 封面图 URL:', coverImageUrl);
  
  const mdContent = fs.readFileSync(REPORT_FILE, 'utf8');
  const htmlContent = markdownToCSDNHtml(mdContent);
  const titleMatch = mdContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'chenmilin.xyz 网站 502 错误诊断报告';
  
  console.log('📝 标题:', title);
  
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
    
    // 4. 上传封面图
    console.log('\n📍 步骤 4: 上传封面图');
    
    // 下载封面图到本地
    console.log('⬇️  下载封面图...');
    const coverResponse = await fetch(coverImageUrl);
    const coverBuffer = Buffer.from(await coverResponse.arrayBuffer());
    const coverPath = '/tmp/cover.png';
    fs.writeFileSync(coverPath, coverBuffer);
    console.log('✅ 封面图已下载:', coverPath);
    
    // 回到编辑器页面
    await page.goto('https://mp.csdn.net/mp_blog/creation/editor', {
      waitUntil: 'networkidle'
    });
    await page.waitForTimeout(2000);
    
    // 查找封面图上传按钮
    console.log('🔍 查找封面图上传区域...');
    
    // 截图当前状态
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-before-cover.png',
      fullPage: true 
    });
    
    // 尝试多种方式找到上传按钮
    let uploadFound = false;
    
    // 方式1：查找包含"封面"文字的元素
    try {
      const coverLabel = await page.locator('text=封面').first();
      if (await coverLabel.isVisible()) {
        console.log('✅ 找到封面区域');
        
        // 查找附近的 input[type=file]
        const fileInput = await page.locator('input[type="file"]').first();
        if (await fileInput.isVisible()) {
          console.log('📤 上传封面图...');
          await fileInput.setInputFiles(coverPath);
          uploadFound = true;
          console.log('✅ 封面图上传成功');
        }
      }
    } catch (e) {
      console.log('⚠️  方式1失败:', e.message);
    }
    
    // 方式2：直接查找所有 file input
    if (!uploadFound) {
      try {
        const fileInputs = await page.locator('input[type="file"]').all();
        console.log(`找到 ${fileInputs.length} 个文件上传输入框`);
        
        for (let i = 0; i < fileInputs.length; i++) {
          const input = fileInputs[i];
          const parent = await input.evaluateHandle(el => el.parentElement?.textContent);
          const parentText = await parent.jsonValue();
          
          if (parentText && parentText.includes('封面')) {
            console.log('📤 找到封面上传框，开始上传...');
            await input.setInputFiles(coverPath);
            uploadFound = true;
            console.log('✅ 封面图上传成功');
            break;
          }
        }
      } catch (e) {
        console.log('⚠️  方式2失败:', e.message);
      }
    }
    
    // 方式3：点击"上传封面"按钮
    if (!uploadFound) {
      try {
        const uploadBtn = await page.locator('button:has-text("上传"), button:has-text("添加封面")').first();
        if (await uploadBtn.isVisible()) {
          await uploadBtn.click();
          await page.waitForTimeout(1000);
          
          const fileInput = await page.locator('input[type="file"]').first();
          await fileInput.setInputFiles(coverPath);
          uploadFound = true;
          console.log('✅ 封面图上传成功');
        }
      } catch (e) {
        console.log('⚠️  方式3失败:', e.message);
      }
    }
    
    if (!uploadFound) {
      console.log('⚠️  未找到封面图上传方式，跳过封面图');
    }
    
    await page.waitForTimeout(2000);
    
    // 5. 截图当前状态
    console.log('\n📍 步骤 5: 截图验证');
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-with-cover-final.png',
      fullPage: true 
    });
    console.log('✅ 截图已保存');
    
    // 6. 保存草稿
    console.log('\n📍 步骤 6: 保存草稿');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(el => (el.innerText || '').trim() === '保存草稿');
      if (saveBtn) {
        saveBtn.click();
      }
    });
    await page.waitForTimeout(3000);
    console.log('✅ 草稿已保存');
    
    // 7. 最终截图
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-final-result.png',
      fullPage: true 
    });
    
    console.log('\n🎉 全自动化发布完成！');
    console.log('📊 结果:');
    console.log('  - 标题:', title);
    console.log('  - 内容长度:', htmlContent.length, '字符');
    console.log('  - 封面图:', uploadFound ? '已上传' : '未上传');
    console.log('  - 状态: 草稿已保存');
    
  } catch (error) {
    console.error('\n❌ 发布失败:', error.message);
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-error-final.png',
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
}

// 从命令行参数获取封面图 URL
const coverImageUrl = process.argv[2] || 
  'https://image.pollinations.ai/prompt/Server%20error%20502%20diagnostic%20report%2C%20technology%20theme%2C%20clean%20minimalist%20design%2C%20blue%20and%20white%20colors%2C%20professional?width=1200&height=630&nologo=true';

publishWithAutoCover(coverImageUrl);