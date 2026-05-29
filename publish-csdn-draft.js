const fs = require('fs');
const { chromium } = require('playwright');

const COOKIE_FILE = '/home/node/.openclaw/workspace/1.txt';

const blogTitle = '【经验分享】薅免费AI API必看：拿到API Key不知道模型？两种核心排查思路';

const blogContent = `
<p>平时逛论坛薅各类公益/免费AI API时，经常遇到一个通病：只给到API Key，不清楚Base URL，也不知道站点支持哪些模型。结合本次5w额度公益API的踩坑经历，总结两种通用排查思路，以后遇到直接套用即可。</p>

<h2>一、正向排查（首选，高效省事）</h2>

<p><strong>适用场景：</strong>已经获取明文Base URL、官网地址</p>
<p><strong>核心逻辑：</strong>目前绝大多数公益AI API均兼容OpenAI接口标准，自带原生查询接口，无需逆向操作，直接查询即可。</p>

<p><strong>操作步骤：</strong></p>

<ol>
<li>确认可用Base URL</li>
<li>命令行直接拉取全量模型列表</li>
</ol>

<pre><code class="language-bash">curl https://xxx.skytop.top/v1/models</code></pre>

<ol start="3">
<li>浏览器访问域名首页，查看站点标注的模型列表、调用文档、剩余额度</li>
</ol>

<p><strong>优点：</strong>一步到位，上手简单，查询速度最快</p>
<p><strong>缺点：</strong>必须先拿到明文Base URL</p>

<h2>二、逆向排查（兜底方案，羊毛帖通用套路）</h2>

<p><strong>适用场景：</strong>作者仅提供Base64、十六进制等加密字符串，刻意隐藏明文地址</p>
<p><strong>核心逻辑：</strong>先解密获取Base URL，再执行正向流程查询模型</p>

<p><strong>操作步骤：</strong></p>

<ol>
<li>对加密串进行Base64解码，再进行二次字符/进制解码</li>
<li>解密得到Base URL后，使用正向方式查询模型</li>
<li>验证API Key可用性</li>
</ol>

<p><strong>优点：</strong>可破解隐藏地址，获取小众公益资源</p>
<p><strong>缺点：</strong>多一道解码步骤，需要处理加密文本</p>

<h2>通用思考流程</h2>

<p>拿到免费API资源 → 判断是否存在明文Base URL</p>

<ol>
<li>有Base URL → 直接正向 curl /v1/models 查询模型</li>
<li>无Base URL（仅加密串）→ 先逆向解密 → 再正向查询</li>
</ol>

<h2>风险提醒</h2>

<ol>
<li>公益API额度消耗速度快，禁止恶意刷量滥用</li>
<li>切勿传输隐私、敏感信息，存在数据泄露风险</li>
<li>此类站点稳定性较差，随时可能关停跑路，建议及时留存可用地</li>
</ol>
`;

async function saveDraft() {
  console.log('📝 CSDN 草稿保存\n');
  console.log('标题:', blogTitle);
  console.log('内容长度:', blogContent.length, '字符\n');
  
  const raw = fs.readFileSync(COOKIE_FILE, 'utf8');
  const cookies = JSON.parse(raw).map(cookie => {
    const mapped = {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path || '/',
    };
    
    if (typeof cookie.expires === 'number') {
      mapped.expires = cookie.expires;
    } else if (typeof cookie.expirationDate === 'number') {
      mapped.expires = cookie.expirationDate;
    }
    
    if (typeof cookie.httpOnly === 'boolean') {
      mapped.httpOnly = cookie.httpOnly;
    }
    if (typeof cookie.secure === 'boolean') {
      mapped.secure = cookie.secure;
    }
    
    if (cookie.sameSite === 'no_restriction') {
      mapped.sameSite = 'None';
    } else if (cookie.sameSite === 'lax') {
      mapped.sameSite = 'Lax';
    } else if (cookie.sameSite === 'strict') {
      mapped.sameSite = 'Strict';
    }
    
    return mapped;
  });
  
  let browser;
  try {
    console.log('🚀 启动浏览器...');
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox']
    });
    
    const context = await browser.newContext({
      locale: 'zh-CN',
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();
    
    console.log('🔑 注入 Cookie...');
    await context.addCookies(cookies);
    
    console.log('🌐 访问编辑器...');
    await page.goto('https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // 等待编辑器加载
    console.log('⏳ 等待编辑器就绪...');
    let retries = 0;
    while (retries < 40) {
      const titleVisible = await page.locator('#txtTitle').isVisible().catch(() => false);
      const editorReady = await page.evaluate(() => Boolean(window.CKEDITOR?.instances?.editor)).catch(() => false);
      
      if (titleVisible && editorReady) {
        console.log('✅ 编辑器已就绪\n');
        break;
      }
      
      await page.waitForTimeout(1500);
      retries++;
    }
    
    // 写入标题
    console.log('📝 写入标题...');
    await page.evaluate((title) => {
      const titleEl = document.getElementById('txtTitle');
      titleEl.value = title;
      titleEl.dispatchEvent(new Event('input', { bubbles: true }));
      titleEl.dispatchEvent(new Event('change', { bubbles: true }));
    }, blogTitle);
    
    await page.waitForTimeout(1000);
    
    // 写入正文
    console.log('📝 写入正文...');
    await page.evaluate((content) => {
      const editor = window.CKEDITOR.instances.editor;
      editor.setData(content);
      editor.updateElement();
    }, blogContent);
    
    await page.waitForTimeout(2000);
    
    // 截图（保存前）
    const beforeScreenshot = `/home/node/.openclaw/workspace/csdn_before_save_${Date.now()}.png`;
    await page.screenshot({ path: beforeScreenshot, fullPage: true });
    console.log('📸 保存前截图:', beforeScreenshot);
    
    // 点击保存草稿
    console.log('\n💾 点击保存草稿...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveButton = buttons.find(el => (el.innerText || '').trim() === '保存草稿');
      if (saveButton) {
        saveButton.click();
      } else {
        throw new Error('找不到保存草稿按钮');
      }
    });
    
    // 等待保存完成
    console.log('⏳ 等待保存完成...');
    await page.waitForTimeout(5000);
    
    // 截图（保存后）
    const afterScreenshot = `/home/node/.openclaw/workspace/csdn_after_save_${Date.now()}.png`;
    await page.screenshot({ path: afterScreenshot, fullPage: true });
    console.log('📸 保存后截图:', afterScreenshot);
    
    console.log('\n========================================');
    console.log('✅ 草稿保存成功！');
    console.log('========================================');
    console.log('请登录 CSDN 创作中心查看草稿');
    console.log('https://mp.csdn.net/mp_blog/manage/article?spm=1011.2480.3001.8124');
    
  } catch (error) {
    console.error('\n❌ 保存失败:', error.message);
    
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const errorScreenshot = `/home/node/.openclaw/workspace/csdn_error_${Date.now()}.png`;
          await pages[0].screenshot({ path: errorScreenshot, fullPage: true });
          console.error('📸 错误截图:', errorScreenshot);
        }
      } catch (e) {}
    }
    
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

saveDraft();
