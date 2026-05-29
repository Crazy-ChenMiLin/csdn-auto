const nodemailer = require('nodemailer');
const fs = require('fs');

async function sendEmail() {
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
    // 创建邮件传输对象
    const transporter = nodemailer.createTransport(mailConfig);

    // 检查连接是否正常
    await transporter.verify();
    console.log('邮件服务器连接成功');

    // 邮件内容
    const mailOptions = {
      from: mailConfig.auth.user,
      to: '2648740368@qq.com',
      subject: '小红书页面截图',
      text: '这是小红书网站的页面截图',
      html: `<strong>这是小红书网站的页面截图</strong><br><p>截图已作为附件发送。</p>`,
      attachments: [
        {
          filename: 'xiaohongshu-screenshot.png',
          content: fs.readFileSync('xiaohongshu-screenshot-2026-05-06T02-48-09-660Z.png'),
          contentType: 'image/png'
        }
      ]
    };

    // 发送邮件
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功');
    console.log('Message ID:', info.messageId);

  } catch (error) {
    console.error('邮件发送失败：', error);
    if (error.code === 'EAUTH') {
      console.error('认证失败：请检查邮箱账号和密码是否正确');
      console.error('注意：163邮箱需要使用授权码而不是登录密码');
    } else if (error.code === 'ENOTFOUND') {
      console.error('找不到邮件服务器：请检查网络连接');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('连接被拒绝：可能是端口或SMTP服务未开启');
    } else {
      console.error('其他错误：', error.message);
    }
  }
}

sendEmail().catch(error => {
  console.error('邮件发送失败：', error);
});
