const { chromium } = require('playwright');
const fs = require('fs');

const COOKIE_FILE = '/home/node/.openclaw/workspace/1.txt';
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

async function debugCoverUpload() {
  console.log('🔍 调试封面图上传流程...');
  
  const cookies = loadCookies(COOKIE_FILE);
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  await context.addCookies(cookies);
  const page = await context.newPage();
  
  try {
    // 访问编辑器
    console.log('📍 访问编辑器...');
    await page.goto('https://mp.csdn.net/mp_blog/creation/editor', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
    
    // 检查登录
    const titleVisible = await page.locator('#txtTitle').isVisible();
    if (!titleVisible) {
      throw new Error('未登录');
    }
    console.log('✅ 登录成功');
    
    // 截图初始状态
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-debug-1-initial.png',
      fullPage: true 
    });
    console.log('📸 截图 1: 初始状态');
    
    // 查找"添加封面"按钮
    console.log('\n📍 查找"添加封面"按钮...');
    const addCoverBtn = await page.locator('button:has-text("添加封面")').first();
    
    if (await addCoverBtn.isVisible()) {
      console.log('✅ 找到"添加封面"按钮');
      
      // 点击按钮
      await addCoverBtn.click();
      await page.waitForTimeout(3000);
      console.log('✅ 已点击"添加封面"按钮');
      
      // 截图点击后状态
      await page.screenshot({ 
        path: '/home/node/.openclaw/workspace/csdn-debug-2-after-click.png',
        fullPage: true 
      });
      console.log('📸 截图 2: 点击后状态');
      
      // 查找上传选项
      console.log('\n📍 查找上传选项...');
      const pageContent = await page.content();
      
      // 查找"从本地上传"按钮
      const localUploadBtn = await page.locator('text=从本地上传').first();
      if (await localUploadBtn.isVisible()) {
        console.log('✅ 找到"从本地上传"按钮');
        
        // 点击"从本地上传"
        await localUploadBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ 已点击"从本地上传"');
        
        // 截图
        await page.screenshot({ 
          path: '/home/node/.openclaw/workspace/csdn-debug-3-local-upload.png',
          fullPage: true 
        });
        console.log('📸 截图 3: 点击本地上传后');
        
        // 现在文件选择器应该打开了，我们需要监听文件选择事件
        // 使用 setInputFiles 直接设置文件
        const fileInput = await page.locator('input[type="file"]').first();
        console.log('📤 上传文件...');
        
        // 等待文件输入框准备好
        await page.waitForTimeout(1000);
        
        await fileInput.setInputFiles(LOCAL_IMAGE);
        console.log('✅ 文件已设置');
        
        // 等待上传完成
        await page.waitForTimeout(5000);
        
        // 截图上传后状态
        await page.screenshot({ 
          path: '/home/node/.openclaw/workspace/csdn-debug-4-after-upload.png',
          fullPage: true 
        });
        console.log('📸 截图 4: 上传后状态');
        
        // 检查是否有封面图预览
        const coverPreview = await page.locator('text=封面图预览').first();
        if (await coverPreview.isVisible()) {
          console.log('✅ 检测到封面图预览区域');
        }
        
        // 检查是否有图片元素
        const coverImg = await page.locator('.cover-image, .article-cover img').first();
        if (await coverImg.isVisible()) {
          console.log('✅ 检测到封面图图片');
        }
        
      } else {
        console.log('❌ 未找到"从本地上传"按钮');
        
        // 尝试直接上传
        console.log('\n📍 尝试直接上传文件...');
        const fileInput = await page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(LOCAL_IMAGE);
        await page.waitForTimeout(5000);
        
        await page.screenshot({ 
          path: '/home/node/.openclaw/workspace/csdn-debug-4-direct-upload.png',
          fullPage: true 
        });
        console.log('📸 截图 4: 直接上传后');
      }
      
    } else {
      console.log('❌ 未找到"添加封面"按钮');
      
      // 截图当前状态
      await page.screenshot({ 
        path: '/home/node/.openclaw/workspace/csdn-debug-no-cover-btn.png',
        fullPage: true 
      });
    }
    
    // 保存草稿
    console.log('\n📍 保存草稿...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(el => (el.innerText || '').trim() === '保存草稿');
      if (saveBtn) saveBtn.click();
    });
    await page.waitForTimeout(3000);
    console.log('✅ 草稿已保存');
    
    // 最终截图
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-debug-5-final.png',
      fullPage: true 
    });
    console.log('📸 截图 5: 最终状态');
    
    console.log('\n🎉 调试完成！请查看截图：');
    console.log('  - csdn-debug-1-initial.png');
    console.log('  - csdn-debug-2-after-click.png');
    console.log('  - csdn-debug-3-local-upload.png');
    console.log('  - csdn-debug-4-after-upload.png');
    console.log('  - csdn-debug-5-final.png');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    await page.screenshot({ 
      path: '/home/node/.openclaw/workspace/csdn-debug-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

debugCoverUpload();