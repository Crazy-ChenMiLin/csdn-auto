---
name: csdn-auto-publish
description: CSDN 博客自动化发布技能，支持 Cookie 登录、封面生成、文章发布。使用 Playwright 和 Microsoft Edge 自动化 CSDN 创作中心编辑器，支持本地生成黑黄风格封面、上传封面、添加标签、发布文章。适用于批量发布、自动化内容管理、Cookie 监控等场景。
---

# CSDN 自动化发布

CSDN 博客平台自动化发布解决方案，支持 Cookie 登录、封面生成、文章发布。

## 功能特点

- ✅ Cookie 登录（支持多种格式）
- ✅ 自动生成黑黄风格封面
- ✅ 上传封面并确认裁剪
- ✅ 填写标题、正文、摘要
- ✅ 添加文章标签
- ✅ 发布文章
- ✅ Cookie 有效期监控

## 快速开始

### 1. 准备 Cookie 文件

从浏览器扩展（如 EditThisCookie）导出 CSDN Cookie，保存为 JSON 文件。

支持的格式：
- JSON 数组 `[{"name": "...", "value": "...", ...}]`
- 对象格式 `{ "cookies": [...] }`
- Netscape 格式（cookie.txt）
- Raw Cookie header 格式

### 2. 运行发布脚本

```bash
cd ~/.openclaw/workspace/skills/csdn-auto-publish/scripts

# 设置环境变量
export CSDN_COOKIE_FILE="/path/to/csdn-cookies.txt"
export CSDN_TITLE="我的文章标题"
export CSDN_TAG="Playwright"
export CSDN_COVER_TOP="Redis 深入理解\n缓存优化实战"
export CSDN_COVER_MAIN="Redis 实战"

# 运行发布
node publish_with_cover.cjs
```

### 3. 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CSDN_COOKIE_FILE` | Cookie 文件路径 | `C:/Users/26487/Desktop/csdn.txt` |
| `CSDN_TITLE` | 文章标题 | 自动生成测试标题 |
| `CSDN_TAG` | 文章标签 | `Playwright` |
| `CSDN_COVER_TOP` | 封面小字（白色） | `CSDN Automation\nCover Publish Test` |
| `CSDN_COVER_MAIN` | 封面大字（黄色） | `Publish Cover` |
| `CSDN_SUMMARY` | 文章摘要 | 自动生成 |
| `CSDN_BODY` | 文章正文 | 自动生成测试内容 |
| `CSDN_OUTPUT_DIR` | 输出目录 | 当前目录 |

## 封面生成逻辑

默认使用确定性 HTML/CSS 渲染生成封面：

- **尺寸**: 1200x675 (16:9)
- **背景**: 纯黑 `#0d0d0d`
- **小字**: 白色，110px，居中
- **大字**: 黄色 `#fff200`，234px，居中

示例：
```bash
export CSDN_COVER_TOP="Cookie 与 Session\n和 JWT OAuth"
export CSDN_COVER_MAIN="登录系统"
```

## 核心流程

```
1. 加载 Cookie → 注入浏览器上下文
2. 生成封面 → 保存为 JPEG
3. 打开编辑器 → 等待加载完成
4. 填写标题 → 触发 input/change 事件
5. 填写正文 → 使用 CKEditor API
6. 上传封面 → 点击"从本地上传"
7. 确认裁剪 → 点击"确认上传"
8. 填写摘要 → 添加标签
9. 点击发布 → 验证成功页面
```

## 输出文件

运行后生成以下文件：

- `csdn_publish_cover.jpg` - 生成的封面
- `csdn_publish_before_click.json/png` - 发布前状态
- `csdn_publish_after_click.json/png` - 发布后状态
- `csdn_publish_result.json` - 发布结果

## 关键技术点

### Cookie 处理

使用 `csdn_helpers.cjs` 自动处理多种 Cookie 格式：

```javascript
const { parseCookiesFromFile } = require("./csdn_helpers.cjs");
const cookies = await parseCookiesFromFile(cookieFile);
await context.addCookies(cookies);
```

### 封面上传

必须点击"确认上传"才能完成封面上传：

```javascript
await page.locator("input.el_mcm-upload__input[type='file']").setInputFiles(coverPath);
await clickTextButton(page, "确认上传");
await page.locator(".vue-image-crop-upload").waitFor({ state: "hidden" });
```

### 标签添加

发布前必须添加至少一个标签：

```javascript
await clickTextButton(page, "添加文章标签");
await input.fill(tag);
await page.keyboard.press("Enter");
```

## 常见问题

### Cookie 失效

**现象**: 页面显示未登录，找不到 `#txtTitle`

**解决**: 重新登录 CSDN，导出最新 Cookie

### 封面上传失败

**现象**: 裁剪对话框一直显示

**解决**: 确保点击了"确认上传"按钮

### 发布按钮无效

**现象**: 点击发布后停留在编辑器页面

**解决**: 检查是否添加了文章标签

### 无头模式问题

**现象**: 无头模式下无法正常操作

**解决**: 使用有头模式或添加反检测参数

## 文件结构

```
csdn-auto-publish/
├── SKILL.md                    # 技能说明
├── scripts/
│   ├── publish_with_cover.cjs  # 封面发布脚本
│   ├── csdn_helpers.cjs        # Cookie 解析工具
│   ├── csdn-publish-template.js # 基础发布模板
│   ├── csdn-cookie-monitor.js  # Cookie 监控
│   └── config.example.js       # 配置示例
```

## 安全提醒

- Cookie 文件包含敏感信息，不要提交到 Git
- 使用 `.gitignore` 忽略 `*.txt` 和 `cookies/` 目录
- 定期更换 Cookie，避免长期暴露