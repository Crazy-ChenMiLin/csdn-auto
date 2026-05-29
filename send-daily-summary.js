const nodemailer = require('nodemailer');

async function sendDailySummary() {
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

    // 邮件内容
    const mailOptions = {
      from: mailConfig.auth.user,
      to: '2648740368@qq.com',
      subject: '📚 学习日报 - 2026年5月16日',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    h3 { color: #7f8c8d; }
    .date { color: #95a5a6; font-size: 14px; margin-bottom: 20px; }
    .section { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .step { background: #e8f5e9; padding: 10px 15px; border-radius: 5px; margin: 5px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #95a5a6; font-size: 12px; }
  </style>
</head>
<body>
  <h1>📚 学习日报</h1>
  <p class="date">📅 2026年5月16日（星期六）</p>
  
  <h2>📋 今日学习内容</h2>
  <div class="section">
    <ul>
      <li>复习并整理前两天（05-14、05-15）的学习记录</li>
      <li>总结提炼学习方法论</li>
      <li>测试邮件发送功能</li>
    </ul>
  </div>

  <h2>📊 近三日学习汇总</h2>
  
  <h3>05-14（周四）</h3>
  <div class="section">
    <ul>
      <li>继续面向简历项目的学习</li>
      <li>逐个知识点推进学习（讲透一个再进行下一个）</li>
      <li>遇到不理解的概念时搜索对应的教学视频</li>
      <li>开始接触项目源代码，进入源码学习阶段</li>
    </ul>
  </div>

  <h3>05-15（周五）</h3>
  <div class="section">
    <ul>
      <li>继续简历项目的知识点推进学习</li>
      <li>采用视频+文字解说的方式攻克不理解的概念</li>
      <li>推进到源代码学习阶段，结合代码理解知识点</li>
      <li>探索如何将文档与代码进行对照学习</li>
    </ul>
  </div>

  <h3>05-16（周六）</h3>
  <div class="section">
    <ul>
      <li>复习并整理前两天的学习记录</li>
      <li>总结提炼学习方法论</li>
      <li>测试邮件发送功能</li>
    </ul>
  </div>

  <h2>💡 学习小贴士</h2>
  <div class="highlight">
    <h3>如何学习一项新技术的流程</h3>
    <div class="step"><strong>第1步：</strong>不懂就去看视频 —— 先通过视频建立感性认知</div>
    <div class="step"><strong>第2步：</strong>懂了让AI逐步讲解 —— AI辅助拆解知识点</div>
    <div class="step"><strong>第3步：</strong>自己总结画流程图 —— 动手输出，加深理解</div>
    <div class="step"><strong>第4步：</strong>循环往复 —— 重复迭代直到彻底掌握</div>
    <div class="step"><strong>第5步：</strong>最后导入文档到仓库 —— 文档结合代码进行系统梳理</div>
  </div>

  <h2>📈 学习状态</h2>
  <div class="section">
    <ul>
      <li><strong>当前阶段：</strong>简历项目学习</li>
      <li><strong>学习重点：</strong>从概念学习到源码学习的过渡</li>
      <li><strong>方法论：</strong>正在探索"理论+实践"结合的最佳方式</li>
    </ul>
  </div>

  <div class="footer">
    <p>📧 此邮件由米林的小助手自动发送</p>
    <p>💡 有任何问题或建议，随时告诉我～</p>
  </div>
</body>
</html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 邮件发送成功！');
    console.log('📧 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ 邮件发送失败：', error.message);
    if (error.code === 'EAUTH') {
      console.error('认证失败：请检查邮箱账号和授权码');
    }
    return { success: false, error: error.message };
  }
}

sendDailySummary().then(result => {
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
