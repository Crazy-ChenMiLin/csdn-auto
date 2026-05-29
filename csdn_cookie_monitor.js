const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const nodemailer = require('nodemailer');

const COOKIE_FILE = path.resolve(process.cwd(), '1.txt');
const CHECK_URL = 'https://mp.csdn.net/mp_blog/creation/editor?not_checkout=1';

// 邮件配置
const mailConfig = {
  host: 'smtp.163.com',
  port: 25,
  secure: false,
  auth: {
    user: '18184720069@163.com',
    pass: 'NSSQxUufDJmQjUhV'
  },
  tls: {
    rejectUnauthorized: false
  }
};

// 发送提醒邮件
async function sendAlertEmail(errorDetails, screenshotPath = null) {
  try {
    const transporter = nodemailer.createTransport(mailConfig);
    
    const attachments = [];
    if (screenshotPath && fs.existsSync(screenshotPath)) {
      attachments.push({
        filename: 'csdn_cookie_error.png',
        path: screenshotPath,
        contentType: 'image/png'
      });
    }

    const mailOptions = {
      from: mailConfig.auth.user,
      to: '2648740368@qq.com',
      subject: '【紧急】CSDN Cookie 已失效 - 需要更新',
      html: `
        <h2>⚠️ CSDN Cookie 监控警报</h2>
        <p><strong>检测到 CSDN Cookie 已失效！</strong></p>
        
        <h3>📊 检测信息</h3>
        <ul>
          <li><strong>检测时间：</strong>${new Date().toLocaleString('zh-CN')}</li>
          <li><strong>检测 URL：</strong>${CHECK_URL}</li>
          <li><strong>Cookie 文件：</strong>${COOKIE_FILE}</li>
        </ul>
        
        <h3>❌ 错误详情</h3>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${errorDetails}</pre>
        
        <h3>🔧 解决方案</h3>
        <ol>
          <li>登录 CSDN 账号</li>
          <li>导出最新的 Cookie JSON</li>
          <li>将内容更新到 <code>1.txt</code> 文件</li>
          <li>通知小助手验证新 Cookie</li>
        </ol>
        
        <hr>
        <p><em>此邮件由 OpenClaw 自动发送</em></p>
        <p><em>下次检测时间：48小时后</em></p>
      `,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 警报邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ 发送警报邮件失败:', error.message);
    return false;
  }
}

// 加载 Cookie
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

// 检查 Cookie 有效性
async function checkCookie() {
  console.log('========================================');
  console.log('CSDN Cookie 监控检查');
  console.log('========================================');
  console.log('检查时间:', new Date().toLocaleString('zh-CN'));
  console.log('');

  let browser;
  let errorScreenshot = null;
  
  try {
    // 检查 Cookie 文件是否存在
    if (!fs.existsSync(COOKIE_FILE)) {
      throw new Error(`Cookie 文件不存在: ${COOKIE_FILE}`);
    }

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ locale: 'zh-CN' });
    const page = await context.newPage();

    // 加载并注入 Cookie
    const cookies = loadCookies(COOKIE_FILE);
    console.log(`✅ 加载了 ${cookies.length} 个 cookies`);
    await context.addCookies(cookies);
    console.log('✅ Cookie 注入完成');

    // 访问编辑器页面
    console.log('🌐 正在访问 CSDN 编辑器...');
    await page.goto(CHECK_URL, { waitUntil: 'networkidle', timeout: 60000 });

    // 检查是否已登录（检测标题输入框）
    const titleVisible = await page.locator('#txtTitle').isVisible().catch(() => false);
    const editorReady = await page.evaluate(() => {
      return Boolean(window.CKEDITOR?.instances?.editor);
    }).catch(() => false);

    if (titleVisible || editorReady) {
      console.log('✅ Cookie 有效 - 已检测到登录状态');
      console.log(`   - 标题框可见: ${titleVisible}`);
      console.log(`   - 编辑器就绪: ${editorReady}`);
      console.log('');
      console.log('========================================');
      console.log('🎉 检查通过！Cookie 正常');
      console.log('========================================');
      return { success: true, message: 'Cookie 有效' };
    } else {
      throw new Error('页面已加载但未检测到登录元素（标题框/编辑器）');
    }

  } catch (error) {
    console.error('❌ Cookie 检查失败:', error.message);
    
    // 如果有浏览器实例，尝试截图
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          errorScreenshot = 'csdn_cookie_check_error.png';
          await pages[0].screenshot({ path: errorScreenshot, fullPage: true });
          console.log('📸 错误截图已保存:', errorScreenshot);
        }
      } catch (screenshotError) {
        console.error('截图失败:', screenshotError.message);
      }
    }

    // 发送警报邮件
    await sendAlertEmail(error.message, errorScreenshot);
    
    return { success: false, message: error.message };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

// 执行检查
checkCookie().then(result => {
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
