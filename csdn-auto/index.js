#!/usr/bin/env node

/**
 * csdn-auto - CSDN 自动化发布工具
 * 
 * 用法：
 *   npx csdn-auto publish    # 发布文章
 *   npx csdn-auto monitor    # 检查 Cookie 有效性
 *   npx csdn-auto help       # 查看帮助
 */

const { execSync } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const command = args[0] || "help";

const scripts = {
  publish: path.join(__dirname, "scripts", "publish_with_cover.cjs"),
  monitor: path.join(__dirname, "scripts", "csdn_cookie_monitor.js"),
};

function showHelp() {
  console.log(`
  csdn-auto - CSDN 自动化发布工具

  用法：
    npx csdn-auto <command>

  命令：
    publish    发布文章（需设置环境变量 CSDN_COOKIE_FILE 等）
    monitor    检查 Cookie 是否有效
    help       显示此帮助信息

  环境变量：
    CSDN_COOKIE_FILE    Cookie 文件路径
    CSDN_TITLE          文章标题
    CSDN_TAG            文章标签
    CSDN_COVER_TOP      封面小字（白色，支持 \\n 换行）
    CSDN_COVER_MAIN     封面大字（黄色）
    CSDN_SUMMARY        文章摘要
    CSDN_BODY           文章正文

  示例：
    CSDN_COOKIE_FILE=./cookies.txt CSDN_TITLE="Hello" npx csdn-auto publish

  GitHub: https://github.com/Crazy-ChenMiLin/csdn-auto
  `);
}

if (command === "help" || command === "--help" || command === "-h") {
  showHelp();
} else if (scripts[command]) {
  try {
    execSync(`node "${scripts[command]}"`, { stdio: "inherit", env: process.env });
  } catch (err) {
    process.exit(err.status || 1);
  }
} else {
  console.error(`未知命令: ${command}`);
  showHelp();
  process.exit(1);
}
