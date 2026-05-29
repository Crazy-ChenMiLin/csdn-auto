const { chromium } = require('playwright');
const fs = require('fs');

const MAX_RETRIES = 5;
const LOGS = [];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  LOGS.push(line);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function tryWithRetry(page, action, selectors, value, desc) {
  for (let i = 0; i < selectors.length; i++) {
    try {
      log(`${desc} - 尝试选择器 ${i+1}/${selectors.length}: ${selectors[i]}`);
      const el = page.locator(selectors[i]).first();
      await el.waitFor({ timeout: 5000 });
      
      if (action === 'fill') {
        await el.fill(value);
      } else if (action === 'click') {
        await el.click();
      } else if (action === 'type') {
        await el.click();
        await page.keyboard.type(value);
      }
      
      log(`✅ ${desc} 成功!`);
      return { success: true, selector: selectors[i] };
    } catch (e) {
      log(`❌ 失败: ${e.message.substring(0, 80)}`);
    }
  }
  return { success: false, error: '所有选择器都失败' };
}

async function runAttempt(attemptNum) {
  log(`\n========== 第 ${attemptNum}/${MAX_RETRIES} 次尝试 ==========`);
  
  const cookies = [
    {"domain":".csdn.net","hostOnly":false,"httpOnly":false,"name":"c_first_page","path":"/","sameSite":null,"secure":false,"session":true,"storeId":null,"value":"https%3A//mp.csdn.net/mp_blog/creation/editor%3Fnot_checkout%3D1%26spm%3D1011.2415.3001.6192"},
    {"domain":".csdn.net","expirationDate":1778091797.578573,"hostOnly":false,"httpOnly":false,"name":"dc_tos","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"temdat"},
    {"domain":".csdn.net","expirationDate":1810444681,"hostOnly":false,"httpOnly":false,"name":"__gpi","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"UID=00001271412fc9cc:T=1776748681:RT=1776748681:S=ALNI_MYi4vjI2jG92dcEbgMc6XtbvdQmyA"},
    {"domain":".csdn.net","hostOnly":false,"httpOnly":false,"name":"c_segment","path":"/","sameSite":null,"secure":false,"session":true,"storeId":null,"value":"13"},
    {"domain":".csdn.net","expirationDate":1811305903.369579,"hostOnly":false,"httpOnly":false,"name":"UN","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"a111ajaj"},
    {"domain":".csdn.net","hostOnly":false,"httpOnly":false,"name":"dc_sid","path":"/","sameSite":null,"secure":false,"session":true,"storeId":null,"value":"ec34b9dfd98f99209a86d6c75ff2bcab"},
    {"domain":".csdn.net","expirationDate":1792297903.369516,"hostOnly":false,"httpOnly":false,"name":"AU","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"46F"},
    {"domain":".csdn.net","expirationDate":1810444681,"hostOnly":false,"httpOnly":false,"name":"__gads","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"ID=a99793257c179e67:T=1776748681:RT=1776748681:S=ALNI_Mbqk04048bOkclod654wP92cjhMfg"},
    {"domain":".csdn.net","expirationDate":1792297903.369387,"hostOnly":false,"httpOnly":true,"name":"UserToken","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"3390401ac9484771b8df4061c7d864a8"},
    {"domain":".csdn.net","expirationDate":1808961169,"hostOnly":false,"httpOnly":false,"name":"_clck","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"3ttp06%5E2%5Eg5m%5E0%5E2302"},
    {"domain":".csdn.net","expirationDate":1778080995,"hostOnly":false,"httpOnly":false,"name":"c_page_id","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"default"},
    {"domain":".csdn.net","expirationDate":1809613395,"hostOnly":false,"httpOnly":false,"name":"Hm_lvt_6bcd52f51e9b3dce32bec4a3997715ac","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"1777377186,1777425169,1777426169,1778056871"},
    {"domain":".csdn.net","expirationDate":1792300681,"hostOnly":false,"httpOnly":false,"name":"__eoi","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":null,"value":"ID=aa10b17afed51b4b:T=1776748681:RT=1776748681:S=AA-Afja6Y6OplO55wDSGjZFjWIYo"},
    {"domain":".csdn.net","hostOnly":false,"httpOnly":false,"name":"HMACCOUNT","path":"/","sameSite":null,"secure":false,"session":true,"storeId":null,"value":"91032764ED20FE48"},
    {"domain":".csdn.net","expirationDate":1778143312,"hostOnly":false,"httpOnly":false,"name":"creative_btn_mp","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"3"},
    {"domain":".csdn.net","expirationDate":1778079197,"hostOnly":false,"httpOnly":false,"name":"log_Id_pv","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"10"},
    {"domain":".csdn.net","expirationDate":1808281903.369637,"hostOnly":false,"httpOnly":false,"name":"BT","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"1776745894699"},
    {"domain":".csdn.net","expirationDate":1779337868.473932,"hostOnly":false,"httpOnly":false,"name":"c_ab_test","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"1"},
    {"domain":".csdn.net","hostOnly":false,"httpOnly":false,"name":"c_dsid","path":"/","sameSite":null,"secure":false,"session":true,"storeId":null,"value":"11_1778076947502.016126"},
    {"domain":".csdn.net","hostOnly":false,"httpOnly":false,"name":"c_first_ref","path":"/","sameSite":null,"secure":false,"session":true,"storeId":null,"value":"default"},
    {"domain":".csdn.net","hostOnly":false,"httpOnly":false,"name":"c_pref","path":"/","sameSite":null,"secure":false,"session":true,"storeId":null,"value":"https%3A//mp.csdn.net/mp_blog/manage/article%3Fspm%3D1011.2480.3001.8124"},
    {"domain":".csdn.net","hostOnly":false,"httpOnly":false,"name":"c_ref","path":"/","sameSite":null,"secure":false,"session":true,"storeId":null,"value":"https%3A//mp.csdn.net/"},
    {"domain":".csdn.net","expirationDate":1784521904,"hostOnly":false,"httpOnly":false,"name":"csdn_newcert_a111ajaj","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"1"},
    {"domain":".csdn.net","expirationDate":1778079197,"hostOnly":false,"httpOnly":false,"name":"dc_session_id","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"10_1778073802715.623058"},
    {"domain":".csdn.net","expirationDate":1811305867.689794,"hostOnly":false,"httpOnly":false,"name":"fid","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"20_16457665756-1776745867689-665842"},
    {"domain":".csdn.net","hostOnly":false,"httpOnly":false,"name":"Hm_lpvt_6bcd52f51e9b3dce32bec4a3997715ac","path":"/","sameSite":null,"secure":false,"session":true,"storeId":null,"value":"1778077396"},
    {"domain":".csdn.net","expirationDate":1778079197,"hostOnly":false,"httpOnly":false,"name":"log_Id_click","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"11"},
    {"domain":".csdn.net","expirationDate":1778079197,"hostOnly":false,"httpOnly":false,"name":"log_Id_view","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"150"},
    {"domain":".csdn.net","expirationDate":1792297903.369697,"hostOnly":false,"httpOnly":false,"name":"p_uid","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"U010000"},
    {"domain":".csdn.net","hostOnly":false,"httpOnly":true,"name":"SESSION","path":"/","sameSite":null,"secure":false,"session":true,"storeId":null,"value":"e1a9f776-5b88-455e-9b30-97c142621b41"},
    {"domain":".csdn.net","expirationDate":1792297903.369317,"hostOnly":false,"httpOnly":true,"name":"UserInfo","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"3390401ac9484771b8df4061c7d864a8"},
    {"domain":".csdn.net","expirationDate":1792297903.369136,"hostOnly":false,"httpOnly":false,"name":"UserName","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"a111ajaj"},
    {"domain":".csdn.net","expirationDate":1792297903.369451,"hostOnly":false,"httpOnly":false,"name":"UserNick","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"%E7%A8%8B%E5%BA%8F%E5%91%98-%E5%A4%A7%E7%B1%B3"},
    {"domain":".csdn.net","expirationDate":1811305867.307865,"hostOnly":false,"httpOnly":false,"name":"uuid_tt_dd","path":"/","sameSite":null,"secure":false,"session":false,"storeId":null,"value":"10_37518540810-1776745858469-762253"}
  ];

  const result = {
    attempt: attemptNum,
    success: false,
    steps: { title: false, content: false, tag: false, publish: false },
    errors: []
  };

  let browser;
  try {
    log('启动浏览器...');
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    await context.addCookies(cookies);
    const page = await context.newPage();

    log('访问 CSDN 编辑器...');
    const resp = await page.goto('https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1&spm=1011.2415.3001.6192', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    log(`页面加载: HTTP ${resp?.status() || 'error'}`);
    
    if (resp?.status() !== 200) {
      throw new Error(`页面加载失败: ${resp?.status()}`);
    }

    // 等待页面渲染
    await sleep(10000);
    
    // 保存初始截图
    await page.screenshot({ path: `attempt-${attemptNum}-start.png`, fullPage: true });
    log('初始截图已保存');

    // 获取页面基本信息
    const pageInfo = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      hasIframes: document.querySelectorAll('iframe').length,
      inputCount: document.querySelectorAll('input').length,
      textareaCount: document.querySelectorAll('textarea').length,
      buttonCount: document.querySelectorAll('button').length
    }));
    log(`页面信息: ${JSON.stringify(pageInfo)}`);

    // 1. 填写标题
    log('\n--- 步骤1: 填写标题 ---');
    const titleResult = await tryWithRetry(page, 'fill', [
      'input[placeholder*="标题"]',
      'input[name*="title"]',
      '[class*="title"] input',
      'input[type="text"]',
      'input',
      '[contenteditable]'
    ], '使用 OpenClaw 自动化发布博客文章的实践', '标题');
    result.steps.title = titleResult.success;
    if (!titleResult.success) result.errors.push('标题填写失败');

    await sleep(3000);

    // 2. 填写内容
    log('\n--- 步骤2: 填写内容 ---');
    const contentResult = await tryWithRetry(page, 'type', [
      'textarea',
      '[contenteditable="true"]',
      '.editor',
      '[class*="content"]',
      'div[role="textbox"]'
    ], '本文介绍了如何使用 OpenClaw 平台结合 Playwright 自动化工具，实现 CSDN 博客平台的自动发布功能。通过 Cookie 认证方式，我们成功绕过了登录验证，实现了博客内容的自动化发布。这种自动化方案可以大大提高内容发布的效率，特别适合需要批量发布文章的场景。', '内容');
    result.steps.content = contentResult.success;
    if (!contentResult.success) result.errors.push('内容填写失败');

    await sleep(3000);

    // 3. 选择标签
    log('\n--- 步骤3: 选择标签 ---');
    const tagResult = await tryWithRetry(page, 'click', [
      '[class*="tag"]',
      'input[placeholder*="标签"]',
      '[data-testid*="tag"]'
    ], null, '标签选择');
    if (tagResult.success) {
      try {
        await page.keyboard.type('人工智能');
        await sleep(1000);
        await page.keyboard.press('