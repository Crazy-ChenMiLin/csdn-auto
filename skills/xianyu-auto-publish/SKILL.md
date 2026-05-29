---
name: xianyu-auto-publish
description: 闲鱼/咸鱼自动化发布技能。使用浏览器导出的 Cookie JSON 文件和 Playwright 自动登录闲鱼网页版，打开发布页面，上传商品图片，填写描述/价格/原价，验证发布按钮状态，并在用户确认后发布商品。适用于需要自动化闲鱼发布流程、测试 Cookie 有效性、批量发布商品等场景。
---

# 闲鱼自动化发布 (Xianyu Auto Publish)

使用浏览器导出的 Cookie JSON 文件和 Playwright 自动化闲鱼/咸鱼网页发布流程。支持三种模式：探测登录状态、填写表单（不发布）、完整发布。

## 安全规则

- **绝不打印 Cookie 值**。可以打印 Cookie 名称、域名、数量和文件元数据。
- **`--mode publish` 是真实的公开发布操作**。仅在用户明确要求发布时运行。
- **探索、登录检查、表单测试**使用 `--mode probe` 或 `--mode fill`。
- **不假设网页草稿功能存在**。在复现测试中，离开页面不会保存或恢复草稿。
- **截图和 JSON 状态保存在工作目录**，通常是 `output/playwright/`，供用户检查。

## 前置要求

- **Cookie JSON 文件**：从浏览器扩展导出的 `.goofish.com` 域名 Cookie
- **Node.js/npm**：通过 `npx` 运行 Playwright
- **本地图片文件**：用于实际填写/发布操作
- **使用普通 Playwright 浏览器上下文**导入 Cookie（OpenClaw 内置浏览器无法注入 `httpOnly` Cookie）
- **默认使用有头模式**：无头模式可能被闲鱼检测为异常访问

## 快速命令

技能脚本路径：
```bash
SCRIPT="$HOME/.openclaw/workspace/skills/xianyu-auto-publish/scripts/auto_xianyu.cjs"
```

### 1. 检查登录状态和发布页面访问权限

```bash
npx --yes --package playwright node "$SCRIPT" \
  --mode probe \
  --cookie "/path/to/xianyu-cookies.json"
```

### 2. 填写发布表单（不提交）

```bash
npx --yes --package playwright node "$SCRIPT" \
  --mode fill \
  --cookie "/path/to/xianyu-cookies.json" \
  --image "/path/to/item.jpg" \
  --description "二手英语学习资料，实物拍摄，页面干净，适合日常复习" \
  --price 1 \
  --original-price 10
```

### 3. 完整发布（需用户明确确认）

```bash
npx --yes --package playwright node "$SCRIPT" \
  --mode publish \
  --cookie "/path/to/xianyu-cookies.json" \
  --image "/path/to/item.jpg" \
  --description "二手英语学习资料，实物拍摄，页面干净，适合日常复习" \
  --price 1 \
  --original-price 10
```

## 工作流程

1. **检查 Cookie 文件**：确认文件存在且为 JSON 格式，仅检查元数据和 Cookie 名称
2. **运行 `--mode probe`**：确认账号能访问 `https://www.goofish.com/publish`
3. **运行 `--mode fill`**：使用真实商品图片、描述、价格填写表单
4. **检查截图/状态**：如果发布按钮禁用，读取 JSON 中的页面文本分析原因
5. **用户明确确认后**：运行 `--mode publish` 执行真实发布
6. **返回结果**：最终商品 URL、截图路径、任何警告信息

## 已知闲鱼行为

- **描述关键词影响自动分类**：包含"自动化测试"、"浏览器流程"、"软件"、"程序"等词汇可能触发网页不支持的分类，导致发布按钮禁用
- **自然实物描述**：如"二手英语学习资料..."在复现测试中成功启用发布按钮
- **成功发布**：页面重定向到 `https://www.goofish.com/item?id=...`，显示卖家控制按钮（下架/删除）
- **无草稿功能**：网页发布页未找到"保存草稿"按钮，重新打开发布 URL 不会恢复已填写内容
- **无头模式可能被拒绝**：如遇"非法访问/请使用正常浏览器"提示，改用有头模式重试

## 参数说明

| 参数 | 必需 | 说明 |
|------|------|------|
| `--mode` | 是 | `probe`（探测）、`fill`（填写）、`publish`（发布） |
| `--cookie` | 是 | Cookie JSON 文件路径 |
| `--image` | fill/publish 必需 | 商品图片本地路径 |
| `--description` | fill/publish 必需 | 商品描述文本 |
| `--price` | fill/publish 必需 | 售价（元） |
| `--original-price` | 否 | 原价（元） |
| `--headless` | 否 | 无头模式（不推荐） |

## 输出文件

所有输出保存在 `output/playwright/` 目录：
- `xianyu_YYYY-MM-DDTHH-mm-ss_initial.png` - 初始页面截图
- `xianyu_YYYY-MM-DDTHH-mm-ss_initial.json` - 初始页面状态
- `xianyu_YYYY-MM-DDTHH-mm-ss_filled.png` - 填写后截图
- `xianyu_YYYY-MM-DDTHH-mm-ss_filled.json` - 填写后状态
- `xianyu_YYYY-MM-DDTHH-mm-ss_final.png` - 最终截图
- `xianyu_YYYY-MM-DDTHH-mm-ss_final.json` - 最终状态

## 故障排查

### 发布按钮禁用
- 检查描述是否包含敏感词汇（软件、程序、自动化等）
- 尝试使用更自然的实物描述
- 查看 JSON 状态文件中的页面文本

### 登录失败
- Cookie 可能已过期，重新导出
- 确认 Cookie 包含 `.goofish.com` 域名
- 尝试有头模式观察页面行为

### 安全验证
- 如遇验证码、扫码确认等，停止并通知用户手动处理
- 不尝试绕过任何安全检查

## 参考

详细 Q&A 和故障排查请阅读 `references/qa.md`。
