const nodemailer = require('nodemailer');

// 邮件配置（与 CSDN 监控脚本一致）
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

async function sendStudyReminder() {
  try {
    const transporter = nodemailer.createTransport(mailConfig);
    
    const today = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    const mailOptions = {
      from: mailConfig.auth.user,
      to: '2648740368@qq.com',
      subject: `🌙 每日学习总结提醒 - ${today}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4a90d9;">🌙 主人，晚上9点了！</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            今天学习结束了吗？来总结一下今天的收获吧！
          </p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #4a90d9; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #333;">📚 今日回顾清单</h3>
            <ul style="line-height: 1.8;">
              <li>今天学到了什么新知识？</li>
              <li>有什么值得记录的内容？</li>
              <li>明天的学习计划是什么？</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            小助手会帮你记录到 <code>每日总结/</code> 文件夹中~ 📝
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            此邮件由 米林的小助手 🤖 自动发送<br>
            发送时间：${new Date().toLocaleString('zh-CN')}
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 学习总结提醒邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ 发送提醒邮件失败:', error.message);
    process.exit(1);
  }
}

sendStudyReminder();
