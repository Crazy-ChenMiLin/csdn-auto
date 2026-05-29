// 日记检查测试 - 第一步：验证文件遍历能力
const fs = require('fs');
const path = require('path');

async function testFileScan() {
  console.log('=== 日记检查测试 - 第一步 ===\n');
  
  // 模拟仓库结构（实际会用 GitHub API）
  const mockFiles = [
    '2026-02-03.md',
    '2026-04-09.md', 
    '每日打卡/2025-12-07.md',
    '每日打卡/2025-12-15.md',
    '每日打卡/2025-12-23.md',
    'Java  se/字符串.md',
    'Java  se/数组.md',
    'Redis/指令.md'
  ];
  
  console.log('1. 扫描所有 Markdown 文件...');
  const mdFiles = mockFiles.filter(f => f.endsWith('.md'));
  console.log(`   找到 ${mdFiles.length} 个 Markdown 文件\n`);
  
  console.log('2. 识别可能的日记文件（含日期特征）...');
  const diaryPatterns = [
    /20\d{2}[-/][01]\d[-/][0123]\d/,  // 2026-05-07 或 2026/05/07
    /\d{4}年\d{2}月\d{2}日/,           // 2026年05月07日
  ];
  
  const possibleDiaries = mdFiles.filter(f => {
    return diaryPatterns.some(pattern => pattern.test(f));
  });
  
  console.log(`   找到 ${possibleDiaries.length} 个可能的日记文件:`);
  possibleDiaries.forEach(f => console.log(`   - ${f}`));
  console.log();
  
  console.log('3. 按文件夹分类...');
  const byFolder = {};
  possibleDiaries.forEach(f => {
    const folder = f.includes('/') ? f.split('/')[0] : '根目录';
    if (!byFolder[folder]) byFolder[folder] = [];
    byFolder[folder].push(f);
  });
  
  Object.entries(byFolder).forEach(([folder, files]) => {
    console.log(`   📁 ${folder}: ${files.length} 个文件`);
  });
  console.log();
  
  console.log('✅ 第一步测试完成！\n');
  console.log('下一步：读取文件内容并用 AI 分析');
}

testFileScan();
