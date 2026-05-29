const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const COOKIE_FILE = path.resolve(process.cwd(), '1.txt');
const EDITOR_URL = 'https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1';

// 文章标题
const blogTitle = "滑板车 vs 电动独轮车：安全性深度对比分析";

// 文章正文（HTML格式）
const blogContent = `
<h2>核心观点</h2>
<p>综合来看，<strong>滑板车的安全性和稳定性整体优于独轮车</strong>，尤其是对于新手。但两者都属于休闲娱乐工具，<span style="color: #e74c3c;"><strong>严禁在公共道路上作为交通工具使用</strong></span>。</p>

<h2>核心维度对比</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
  <tr style="background-color: #f2f2f2;">
    <th style="text-align: left;">对比维度</th>
    <th style="text-align: left;">滑板车（两轮/三轮）</th>
    <th style="text-align: left;">电动独轮车</th>
  </tr>
  <tr>
    <td><strong>基础稳定性</strong></td>
    <td>✅ <strong>优秀：</strong>宽轮距+低重心，静止可保持平衡</td>
    <td>❌ <strong>极差：</strong>单轮设计，天然不稳定，静止必倒</td>
  </tr>
  <tr>
    <td><strong>学习难度</strong></td>
    <td>✅ <strong>简单：</strong>多数人1-2小时可掌握基本操作</td>
    <td>❌ <strong>极难：</strong>平均需7-12小时才能独立骑行</td>
  </tr>
  <tr>
    <td><strong>制动可靠性</strong></td>
    <td>⚠️ <strong>一般：</strong>手刹+脚刹，廉价产品制动距离可达9.9米</td>
    <td>❌ <strong>差：</strong>完全靠重心后移减速，紧急制动易失控</td>
  </tr>
  <tr>
    <td><strong>新手摔倒概率</strong></td>
    <td>⚠️ <strong>中等：</strong>初期转弯、急刹易摔</td>
    <td>❌ <strong>极高：</strong>几乎所有新手都会经历多次摔倒</td>
  </tr>
  <tr>
    <td><strong>低速容错率</strong></td>
    <td>✅ <strong>较高：</strong>低速行驶仍能保持稳定</td>
    <td>❌ <strong>极低：</strong>速度越慢，平衡越难控制</td>
  </tr>
  <tr>
    <td><strong>常见伤害部位</strong></td>
    <td>头部、手腕、膝盖</td>
    <td>头部、手腕、膝盖、<strong>尾椎</strong></td>
  </tr>
</table>

<h2>关键安全差异详解</h2>

<h3>1. 平衡机制本质不同</h3>
<ul>
  <li><strong>滑板车：</strong>依靠物理结构保持平衡，骑手只需控制方向和速度，无需持续维持直立姿态</li>
  <li><strong>独轮车：</strong>前后平衡靠陀螺仪，左右平衡完全依赖骑手的精细肌肉控制，任何微小失误都可能导致摔倒</li>
</ul>

<h3>2. 紧急情况应对能力</h3>
<ul>
  <li><strong>滑板车：</strong>遇到突发状况时，可以随时双脚落地站稳</li>
  <li><strong>独轮车：</strong>在高速或复杂路况下，一旦失去平衡，骑手往往来不及反应，容易发生严重摔伤</li>
</ul>

<h3>3. 路况适应性</h3>
<ul>
  <li><strong>滑板车：</strong>车轮小（6-10寸），对路面要求高，遇到坑洼、减速带容易颠簸失控</li>
  <li><strong>独轮车：</strong>车轮大（14-18寸），通过性理论上更好，但遇到障碍物时更容易失去平衡</li>
</ul>

<h2>⚠️ 重要安全提醒</h2>

<div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0;">
  <h3 style="margin-top: 0;">1. 法律规定</h3>
  <p>中国绝大多数城市<strong>明确禁止</strong>滑板车、独轮车、平衡车等在机动车道、非机动车道和人行道上行驶。</p>
</div>

<div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0;">
  <h3 style="margin-top: 0;">2. 防护装备（必须佩戴）</h3>
  <ul>
    <li>✅ 头盔（必备）</li>
    <li>✅ 护膝</li>
    <li>✅ 护肘</li>
    <li>✅ 护腕</li>
  </ul>
  <p><em>研究表明，正确佩戴头盔能将头部受伤风险降低 60%-70%</em></p>
</div>

<div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 15px 0;">
  <h3 style="margin-top: 0;">3. 使用场景限制</h3>
  <p>只能在<strong>封闭、平坦、无行人的场地</strong>内使用，如小区广场、公园等。</p>
</div>

<div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0;">
  <h3 style="margin-top: 0;">4. 速度控制</h3>
  <p>始终保持低速行驶，不要尝试高难度动作。</p>
</div>

<h2>结论与建议</h2>

<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
  <tr style="background-color: #d4edda;">
    <td style="width: 30%;"><strong>🎯 新手首选</strong></td>
    <td>滑板车 - 更容易上手，风险相对较低</td>
  </tr>
  <tr style="background-color: #fff3cd;">
    <td><strong>⚠️ 选择独轮车需谨慎</strong></td>
    <td>必须做好长期练习和频繁摔倒的心理准备，且绝对不能在公共道路上使用</td>
  </tr>
  <tr style="background-color: #f8d7da;">
    <td><strong>🛡️ 无论选择哪种</strong></td>
    <td>安全永远是第一位的，严格遵守使用规范，佩戴好防护装备</td>
  </tr>
</table>

<hr>
<p style="color: #666; font-size: 14px;"><em>本文仅供参考，使用任何交通工具前请了解当地法规，并做好安全防护措施。</em></p>
`;

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
}

async function waitForLoggedInEditor(page, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const titleVisible = await page.locator('#txtTitle').isVisible().catch(() => false);
    const editorReady = await page.evaluate(() => {
      return Boolean(window.CKEDITOR?.instances?.editor);
    }).catch(() => false);

    if (titleVisible && editorReady) {
      return { titleVisible, editorReady };
    }
    await page.waitForTimeout(1500);
  }
  throw new Error('CSDN editor did not become ready in time');
}

async function writeTitle(page, title) {
  await page.evaluate((value) => {
    const titleEl = document.getElementById('txtTitle');
    if (!titleEl) throw new Error('Title input #txtTitle not found');
    titleEl.value = value;
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
    titleEl.dispatchEvent(new Event('change', { bubbles: true }));
  }, title);
}

async function writeBodyToCkEditor(page, html) {
  await page.evaluate((content) => {
    const editor = window.CKEDITOR?.instances?.editor;
    if (!editor) throw new Error('CKEditor instance editor not found');
    editor.setData(content);
    editor.updateElement();
  }, html);
}

async function clickSaveDraft(page) {
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveButton = buttons.find(el => 
      (el.innerText || '').trim() === '保存草稿' ||
      (el.textContent || '').trim() === '保存草稿'
    );
    if (!saveButton) throw new Error('Save draft button not found');
    saveButton.click();
  });
}

(async () => {
  console.log('========================================');
  console.log('CSDN 文章保存 - 滑板车 vs 独轮车安全对比');
  console.log('========================================');
  console.log('标题:', blogTitle);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'zh-CN' });
  const page = await context.newPage();

  try {
    // 加载并注入 Cookie
    const cookies = loadCookies(COOKIE_FILE);
    console.log(`✅ 加载了 ${cookies.length} 个 cookies`);
    await context.addCookies(cookies);
    console.log('✅ Cookie 注入完成');

    // 访问编辑器
    console.log('🌐 正在打开编辑器...');
    await page.goto(EDITOR_URL, { waitUntil: 'networkidle' });

    // 等待登录和编辑器就绪
    console.log('⏳ 等待编辑器就绪...');
    const status = await waitForLoggedInEditor(page);
    console.log('✅ 编辑器就绪:', status);

    // 写入标题
    console.log('📝 写入标题...');
    await writeTitle(page, blogTitle);
    console.log('✅ 标题写入完成');

    // 写入正文
    console.log('📝 写入正文...');
    await writeBodyToCkEditor(page, blogContent);
    console.log('✅ 正文写入完成');

    await page.waitForTimeout(2000);

    // 填写前的截图
    await page.screenshot({ path: 'csdn_article_before_save.png', fullPage: true });
    console.log('📸 已保存截图: csdn_article_before_save.png');

    // 点击保存草稿
    console.log('💾 正在保存草稿...');
    await clickSaveDraft(page);
    console.log('✅ 已点击保存草稿按钮');

    // 等待保存完成
    await page.waitForTimeout(5000);

    // 保存后的截图
    await page.screenshot({ path: 'csdn_article_after_save.png', fullPage: true });
    console.log('📸 已保存截图: csdn_article_after_save.png');

    console.log('');
    console.log('========================================');
    console.log('🎉 文章草稿保存完成！');
    console.log('========================================');
    console.log('标题:', blogTitle);

  } catch (err) {
    console.error('❌ 错误:', err.message);
    await page.screenshot({ path: 'csdn_article_error.png', fullPage: true });
    console.log('📸 错误截图已保存: csdn_article_error.png');
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
})();
