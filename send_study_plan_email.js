const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

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

// 检查最近几天的总结情况
function checkRecentSummaries(daysToCheck = 7) {
  const missingSummaries = [];
  const today = new Date();
  
  for (let i = 1; i <= daysToCheck; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dateStr = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    // 检查 memory 文件
    const memoryPath = path.join(process.cwd(), 'memory', `${dateStr}.md`);
    
    let hasSummary = false;
    if (fs.existsSync(memoryPath)) {
      const content = fs.readFileSync(memoryPath, 'utf8');
      // 检查是否有总结相关的关键词
      const summaryKeywords = ['总结', '今日总结', '学习总结', '完成', '收获', '心得'];
      hasSummary = summaryKeywords.some(keyword => content.includes(keyword));
    }
    
    if (!hasSummary) {
      missingSummaries.push({
        date: date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        }),
        daysAgo: i
      });
    }
  }
  
  return missingSummaries;
}

// 获取今天的学习计划
function getTodayStudyPlan() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  
  const planPath = path.join(process.cwd(), '学习计划', `${dateStr}-学习计划.md`);
  
  if (fs.existsSync(planPath)) {
    return fs.readFileSync(planPath, 'utf8');
  }
  
  return null;
}

async function sendStudyPlanEmail() {
  try {
    const transporter = nodemailer.createTransport(mailConfig);
    
    const today = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    // 检查最近几天的总结情况
    const missingSummaries = checkRecentSummaries(7);
    
    // 构建总结提醒 HTML
    let summaryReminderHtml = '';
    if (missingSummaries.length > 0) {
      const reminderItems = missingSummaries.map(miss => {
        return `<li style="margin: 8px 0; color: #dc3545;">⚠️ <strong>${miss.date}</strong> - ${miss.daysAgo === 1 ? '昨天' : `${miss.daysAgo}天前`} 没有总结记录</li>`;
      }).join('');
      
      summaryReminderHtml = `
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #856404; margin-top: 0;">📝 总结提醒</h3>
          <p style="margin: 10px 0; color: #856404;">以下日期没有找到学习总结，是不是忘了？</p>
          <ul style="margin: 10px 0 20px 20px; padding: 0;">
            ${reminderItems}
          </ul>
          <p style="margin: 0; color: #856404; font-size: 14px;">💡 记得及时补上总结，这样可以更好地追踪学习进度哦！</p>
        </div>
      `;
    }

    // 尝试获取今天的学习计划
    const planContent = getTodayStudyPlan();
    
    let planHtml = '';
    if (planContent) {
      // 简单 Markdown 转 HTML
      planHtml = planContent
        .replace(/^# (.*$)/gm, '<h1 style="color: #4a90d9;">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 style="color: #333; border-bottom: 2px solid #4a90d9; padding-bottom: 5px;">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 style="color: #555;">$1</h3>')
        .replace(/\|([^|]+)\|([^|]+)\|/g, '<tr><td style="padding: 8px; border: 1px solid #ddd;">$1</td><td style="padding: 8px; border: 1px solid #ddd;">$2</td></tr>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/- \[ \] (.*$)/gm, '<li style="margin: 5px 0;">⬜ $1</li>')
        .replace(/- \[x\] (.*$)/gm, '<li style="margin: 5px 0; color: #28a745;">✅ $1</li>')
        .replace(/\n\n/g, '</p><p style="line-height: 1.6;">')
        .replace(/^- (.*$)/gm, '<li style="margin: 5px 0;">• $1</li>');
    } else {
      planHtml = '<p style="color: #666;">今天还没有制定学习计划，记得规划一下哦！</p>';
    }

    const mailOptions = {
      from: mailConfig.auth.user,
      to: '2648740368@qq.com',
      subject: `📅 今日学习计划 - ${today}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4a90d9;">🌅 主人，早上好！</h2>
          
          ${summaryReminderHtml}
          
          <p style="font-size: 16px; line-height: 1.6;">
            新的一天开始了，看看今天的学习计划吧！
          </p>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            ${planHtml}
          </div>
          
          <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0;">💡 学习小贴士</h4>
            <ul style="margin: 10px 0;">
              <li>累了就趴一会儿，恢复精力</li>
              <li>二刷课程加深理解</li>
              <li>每 45-60 分钟休息一次</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            此邮件由 米林的小助手 🤖 自动发送<br>
            发送时间：${new Date().toLocaleString('zh-CN')}
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 学习计划邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ 发送学习计划邮件失败:', error.message);
    process.exit(1);
  }
}

sendStudyPlanEmail();
