# CSDN 自动化发布

CSDN 博客平台自动化发布解决方案，使用 Playwright + Cookie 登录，支持封面自动生成、文章发布、Cookie 监控。

## 功能特点

- ✅ Cookie 登录（支持多种格式：JSON 数组、对象、Netscape、Raw Header）
- ✅ 自动生成黑黄风格封面（纯黑背景 + 白色小字 + 黄色大字）
- ✅ 上传封面并确认裁剪
- ✅ 填写标题、正文、摘要
- ✅ 添加文章标签
- ✅ 发布文章
- ✅ Cookie 有效期自动监控（定时检查 + 邮件提醒）

## 快速开始

### 1. 安装依赖

```bash
npm install csdn-auto
# 或
npx csdn-auto
```

### 2. 准备 Cookie 文件

从浏览器扩展（如 EditThisCookie）导出 CSDN Cookie，保存为 JSON 文件。

### 3. 发布文章

```bash
export CSDN_COOKIE_FILE="/path/to/cookies.txt"
export CSDN_TITLE="我的文章标题"
export CSDN_TAG="Playwright"
export CSDN_COVER_TOP="封面小字\n第二行"
export CSDN_COVER_MAIN="封面大字"
export CSDN_SUMMARY="文章摘要"
export CSDN_BODY="文章正文内容"

npx csdn-auto publish
```

### 4. Cookie 监控

```bash
npx csdn-auto monitor
```

## 封面设计

| 属性 | 值 |
|------|-----|
| 尺寸 | 1200×675 (16:9) |
| 背景 | 纯黑 `#0d0d0d` |
| 小字 | 白色，110px，居中（支持 `\n` 换行） |
| 大字 | 黄色 `#fff200`，234px，居中 |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CSDN_COOKIE_FILE` | Cookie 文件路径 | `./1.txt` |
| `CSDN_TITLE` | 文章标题 | 自动生成测试标题 |
| `CSDN_TAG` | 文章标签 | `Playwright` |
| `CSDN_COVER_TOP` | 封面小字（白色） | `CSDN Automation\nCover Publish Test` |
| `CSDN_COVER_MAIN` | 封面大字（黄色） | `Publish Cover` |
| `CSDN_SUMMARY` | 文章摘要 | 自动生成 |
| `CSDN_BODY` | 文章正文 | 自动生成测试内容 |
| `CSDN_OUTPUT_DIR` | 输出目录 | 当前目录 |

## 文件结构

```
csdn-auto/
├── package.json                    # npm 包配置
├── index.js                        # CLI 入口
├── README.md                       # 说明文档
├── SKILL.md                        # OpenClaw 技能描述
├── .gitignore                      # Git 忽略规则
├── LICENSE                         # MIT 协议
├── examples.md                     # 使用示例
├── .github/workflows/publish.yml   # npm 自动发布工作流
└── scripts/
    ├── publish_with_cover.cjs      # 核心：封面生成 + 文章发布
    ├── csdn_helpers.cjs            # Cookie 解析工具
    ├── csdn-cookie-monitor.js      # Cookie 监控（定时检查 + 邮件）
    ├── csdn_cookie_monitor.js      # Cookie 监控（独立版）
    ├── csdn-publish-template.js    # 基础发布模板
    ├── config.example.js           # 配置示例
    └── ...
```

## 核心流程

```
1. 加载 Cookie → 注入浏览器上下文
2. 生成封面 → HTML/CSS 渲染为 JPEG
3. 打开编辑器 → 等待加载完成
4. 填写标题 → 触发 input/change 事件
5. 填写正文 → 使用 CKEditor API
6. 上传封面 → 点击"从本地上传"
7. 确认裁剪 → 点击"确认上传"
8. 填写摘要 → 添加标签
9. 点击发布 → 验证成功页面
```

## GitHub Actions 自动发布

本项目配置了 npm 自动发布工作流，触发方式：

### 方式 1：推送 Tag（推荐）

```bash
git tag v1.0.1
git push origin v1.0.1
```

### 方式 2：手动触发

在 GitHub 仓库页面 → Actions → Publish to npm → Run workflow

### 前置条件

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：
- `NPM_TOKEN`：npm Access Token（在 npmjs.com → Access Tokens 创建）

## 注意事项

- Cookie 文件包含敏感信息，**不要提交到 Git**
- 定期更换 Cookie，避免长期暴露
- 无头模式可能被检测，建议使用有头模式或添加反检测参数
- 描述中避免使用"自动化"、"软件"等敏感词

## License

MIT
