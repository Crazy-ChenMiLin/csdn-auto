# 使用示例

## 1. 准备 Cookie 文件

从浏览器扩展（如 EditThisCookie、Cookie Editor）导出 `.goofish.com` 域名的 Cookie，保存为 JSON 文件。

## 2. 检查登录状态

```bash
SCRIPT="$HOME/.openclaw/workspace/skills/xianyu-auto-publish/scripts/auto_xianyu.cjs"

npx --yes --package playwright node "$SCRIPT" \
  --mode probe \
  --cookie "/path/to/xianyu-cookies.json" \
  --headless
```

## 3. 填写表单（不发布）

```bash
npx --yes --package playwright node "$SCRIPT" \
  --mode fill \
  --cookie "/path/to/xianyu-cookies.json" \
  --image "/path/to/item.jpg" \
  --description "二手英语学习资料，实物拍摄，页面干净，适合日常复习" \
  --price 1 \
  --original-price 10 \
  --headless
```

## 4. 真实发布（需确认）

```bash
npx --yes --package playwright node "$SCRIPT" \
  --mode publish \
  --cookie "/path/to/xianyu-cookies.json" \
  --image "/path/to/item.jpg" \
  --description "二手英语学习资料，实物拍摄，页面干净，适合日常复习" \
  --price 1 \
  --original-price 10 \
  --headless
```

## 输出文件

所有截图和状态文件保存在 `output/playwright/` 目录：
- `xianyu_*_initial.png/json` - 初始页面
- `xianyu_*_filled.png/json` - 填写后
- `xianyu_*_final.png/json` - 发布后

## 成功案例

- **测试日期**: 2026-05-20
- **商品链接**: https://www.goofish.com/item?id=1052136730759
- **售价**: ¥1
- **状态**: 发布成功
