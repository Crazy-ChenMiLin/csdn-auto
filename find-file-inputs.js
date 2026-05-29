const fs = require('fs');
const htmlPath = '/home/node/.openclaw/workspace/media-type-test-3-2026-05-06T08-07-55-510Z.html';

try {
  // 读取HTML文件内容
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // 使用正则表达式查找文件输入框
  const fileInputRegex = /<input[^>]*type=["']file["'][^>]*>/gi;
  const fileInputs = htmlContent.match(fileInputRegex);
  
  if (fileInputs) {
    console.log(`找到 ${fileInputs.length} 个文件输入框:`);
    fileInputs.forEach((input, index) => {
      console.log(`\n文件输入框 ${index + 1}:`);
      console.log(input);
      
      // 查找accept属性
      const acceptMatch = input.match(/accept=["']([^"']*)["']/);
      if (acceptMatch) {
        console.log(`接受的文件类型: ${acceptMatch[1]}`);
      } else {
        console.log('接受的文件类型: 未指定');
      }
    });
  } else {
    console.log('未找到文件输入框');
  }
  
  // 查找所有可能的上传相关按钮
  console.log('\n--- 查找上传相关按钮 ---');
  const uploadButtonRegex = /<button[^>]*>([^<]*上传[^<]*|上传)<\/button>/gi;
  const uploadButtons = htmlContent.match(uploadButtonRegex);
  
  if (uploadButtons) {
    console.log(`找到 ${uploadButtons.length} 个上传相关按钮:`);
    uploadButtons.forEach((button, index) => {
      console.log(`\n上传按钮 ${index + 1}:`);
      console.log(button);
    });
  } else {
    console.log('未找到上传相关按钮');
  }
  
  // 查找所有按钮
  console.log('\n--- 查找所有按钮 ---');
  const buttonRegex = /<button[^>]*>([^<]*)<\/button>/gi;
  const allButtons = htmlContent.match(buttonRegex);
  
  if (allButtons) {
    console.log(`找到 ${allButtons.length} 个按钮:`);
    const uniqueButtons = [...new Set(allButtons)];
    uniqueButtons.forEach((button, index) => {
      console.log(`\n按钮 ${index + 1}:`);
      console.log(button);
    });
  } else {
    console.log('未找到按钮');
  }
  
} catch (error) {
  console.error('读取或解析HTML文件失败:', error);
}
