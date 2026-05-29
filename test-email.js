const nodemailer = require('nodemailer');

async function sendTestEmail() {
  // 163邮箱配置
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

  try {
    const transporter = nodemailer.createTransport(mailConfig);
    await transporter.verify();
    console.log('✅ 邮件服务器连接成功');

    const mailOptions = {
      from: mailConfig.auth.user,
      to: '2648740368@qq.com',
      subject: '【测试】CSDN Cookie监控邮件服务测试',
      text: '这是一封测试邮件。\n\n如果你收到这封邮件，说明邮件服务配置正确。\n\n接下来将设置CSDN Cookie自动监控任务。',
      html: `
        <h2>🧪 CSDN Cookie监控邮件服务测试</h2>
        <p>这是一封测试邮件。</p>
        <p><strong>如果你收到这封邮件，说明邮件服务配置正确。</strong></p>
        <hr>
        <p>接下来将设置CSDN Cookie自动监控任务：</p>
        <ul>
          <li>定期访问CSDN主页检测Cookie有效性</li>
          <li>Cookie失效时立即发送提醒邮件</li>
        </ul>
        <p><em>发送时间：${new Date().toLocaleString('zh-CN')}</em></p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 邮件发送成功');
    console.log('Message ID:', info.messageId);
    return true;

  } catch (error) {
    console.error('❌ 邮件发送失败:', error.message);
    if (error.code === 'EAUTH') {
      console.error('认证失败：请检查邮箱授权码是否正确');
    }
    return false;
  }
}

sendTestEmail();
