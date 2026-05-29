# 使用示例

## 1. 基础发布（带封面）

```bash
cd ~/.openclaw/workspace/skills/csdn-auto-publish/scripts

export CSDN_COOKIE_FILE="$HOME/.openclaw/workspace/csdn-cookies.json"
export CSDN_TITLE="Redis 缓存优化实战指南"
export CSDN_TAG="Redis"
export CSDN_COVER_TOP="Redis 深入理解\n缓存优化实战"
export CSDN_COVER_MAIN="Redis 实战"

node publish_with_cover.cjs
```

## 2. 自定义封面文字

```bash
export CSDN_COVER_TOP="Cookie 与 Session\n和 JWT OAuth"
export CSDN_COVER_MAIN="登录系统"
```

## 3. 自定义文章内容

```bash
export CSDN_SUMMARY="本文详细介绍 Redis 缓存优化的最佳实践"
export CSDN_BODY="# Redis 缓存优化\n\n本文介绍..."
```

## 4. Cookie 监控

```bash
node csdn-cookie-monitor.js
```

## 输出示例

```json
{
  "status": "published",
  "title": "Redis 缓存优化实战指南",
  "coverPath": "/path/to/csdn_publish_cover.jpg",
  "url": "https://mp.csdn.net/mp_blog/creation/success/123456",
  "imageCount": 3,
  "hasCoverPreview": true,
  "selectedCategory": true
}
```

## 成功判定

- `status: "published"` - 发布成功
- URL 包含 `/creation/success/` - 发布成功
- 页面文本包含 "发布成功" - 发布成功
