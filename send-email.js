const sgMail = require('@sendgrid/mail');
const fs = require('fs');

async function sendEmail() {
  // 从环境变量或配置文件获取API密钥
  // 注意：在实际部署中，应该使用环境变量或安全的配置方法
  const sendgridApiKey = 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // 这是一个示例密钥，需要替换为真实密钥
  
  if (!sendgridApiKey || sendgridApiKey.includes('xxxx')) {
    console.error('错误：请配置有效的SendGrid API密钥');
    return;
  }

  sgMail.setApiKey(sendgridApiKey);

  const msg = {
    to: '2648740368@qq.com', // 接收者邮箱
    from: 'your-email@example.com', // 发送者邮箱（需要在SendGrid中验证）
    subject: 'Playwright监控截图 - crazyfrank.top',
    text: '这是crazyfrank.top第2页的监控截图',
    html: `<strong>这是crazyfrank.top第2页的监控截图</strong><br><p>截图已作为附件发送。</p>`,
    attachments: [
      {
        content: fs.readFileSync('screenshot-2026-05-06T01-50-58-054Z.png').toString('base64'),
        filename: 'crazyfrank-top-page-2.png',
        type: 'image/png',
        disposition: 'attachment',
        contentId: '123456'
      }
    ]
  };

  try {
    await sgMail.send(msg);
    console.log('邮件发送成功');
  } catch (error) {
    console.error('邮件发送失败：', error);
    if (error.response) {
      console.error('错误响应：', error.response.body);
    }
  }
}

sendEmail().catch(error => {
  console.error('邮件发送失败：', error);
});
