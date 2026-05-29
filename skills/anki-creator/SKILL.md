---
name: anki-creator
description: 通过 Anki MCP 远程控制 Anki，用于快速创建、编辑和同步 Anki 卡片。适用于用户要求生成 Anki 卡片、将学习笔记转换为 Anki 卡片、更新或同步卡片时。使用 MCP 协议操作 AnkiConnect。
---

# Anki 卡片制卡器

通过 Anki MCP 远程控制 Anki，支持批量创建、更新、删除和同步卡片。

## 连接配置

- **MCP服务器**: `anki` (配置于 openclaw.json)
- **MCP版本**: `0.2.0-beta.2` (⚠️ v0.1.8 有 Bug，必须使用 beta 版本)
- **AnkiConnect地址**: `47.108.66.230:8765`
- **牌组**: `系统默认`
- **笔记类型**: `ai` (支持 Front, Back, Example, Extra, Source 字段)

### ⚠️ 重要：MCP 版本问题

`anki-mcp-server` v0.1.8 存在已知 Bug：
```
TypeError: this.server.notify is not a function
```

**解决方案**：使用 `0.2.0-beta.2` 版本，该版本已修复此问题。

**启动命令**：
```bash
npx -y anki-mcp-server@0.2.0-beta.2 --url http://47.108.66.230:8765
```

## 制卡流程

### 1. 梳理知识点
- 阅读用户提供的内容
- 提取核心概念和问答对
- 按主题分组整理

### 2. 格式化卡片内容
使用 `ai` 模板结构：
- **Front**: 问题/概念 (简洁明了)
- **Back**: 核心答案 (简短，可用 HTML 标签如 `<b>`、`<code>`、`<br>`)
- **Example**: 具体示例 (代码片段、场景说明)
- **Extra**: 补充说明 (原理、注意事项)
- **Source**: 知识点来源

### 3. 批量操作卡片（通过 MCP）

#### 删除旧卡片
```python
# 通过 MCP 调用 AnkiConnect
# 使用 anki MCP 服务器的工具
mcp_anki_find_notes(query="tag:Redis tag:缓存")
mcp_anki_delete_notes(notes=note_ids)
```

#### 添加新卡片
```python
# 通过 MCP 添加卡片
mcp_anki_add_note(
    deckName="系统默认",
    modelName="ai",
    fields={
        "Front": "问题",
        "Back": "核心答案",
        "Example": "具体示例",
        "Extra": "补充说明",
        "Source": "来源"
    },
    tags=["标签1", "标签2"]
)
```

#### 云同步
```python
mcp_anki_sync()
```

## 使用流程

### 1. 交互式询问（推荐）
每次运行脚本时会首先询问：
```
=== Anki 批量制卡工具 ===
是否要创建新的参考目录？(y/N): 
```

**回复示例：**
- `y` 或 `yes`：表示要创建新目录
- `N` 或直接回车：表示使用默认目录

### 2. 新目录创建流程
```
=== Anki 批量制卡工具 ===
是否要创建新的参考目录？(y/N): y
请输入参考目录名称（或留空自动生成）: Caffeine和Buffer区别
使用目录: Caffeine和Buffer区别
```

### 3. 脚本运行选项

#### 自动目录创建
```bash
# 使用不存在的目录，会自动创建目录和示例卡片
python3 scripts/add_cards.py --reference-dir="Java线程池"
```

脚本会自动：
1. 创建不存在的目录 `references/Java线程池/`
2. 在目录中创建示例卡片文件 `cards_data.json`
3. 包含一个待整理的示例卡片

#### 常用选项
```bash
# 交互式模式（默认）
python3 scripts/add_cards.py

# 使用指定参考目录
python3 scripts/add_cards.py --reference-dir="Caffeine和Buffer区别"

# 直接指定卡片文件
python3 scripts/add_cards.py --cards-file="/path/to/my_cards.json"

# 不删除旧卡片（直接添加）
python3 scripts/add_cards.py --no-delete
```

### 4. 目录结构管理
```bash
# 查看所有参考目录
ls -la references/

# 创建新目录
mkdir -p references/新主题名称

# 删除目录（谨慎操作）
rm -rf references/旧主题名称
```

## 目录管理

### 创建新目录
每次处理新内容时，建议：
1. 先通过标题大概总结内容
2. 创建对应的参考目录
3. 在此目录下创建 cards_data.json 文件
4. 使用 --reference-dir 参数指定目录

例如处理 Caffeine 和 Buffer 内容时：
```bash
# 创建目录
mkdir -p references/Caffeine和Buffer区别

# 创建 cards_data.json 文件
cat > references/Caffeine和Buffer区别/cards_data.json << 'EOF'
[
    {
        "front": "Caffeine 和 Buffer 属于哪个领域？",
        "back": "Caffeine 是 Java 高性能本地缓存库，Buffer 是操作系统级临时缓冲区",
        "tags": ["Java", "Caffeine", "Buffer"]
    }
]
EOF

# 运行脚本
python3 scripts/add_cards.py --reference-dir="Caffeine和Buffer区别"
```

### 目录结构建议
```
skills/anki-creator/references/
├── cards_data.json                 # 默认卡片集
├── Redis和缓存优化/                # Redis 相关内容
│   └── cards_data.json
└── Caffeine和Buffer区别/            # Caffeine 相关内容
    └── cards_data.json
```

## 常见问题

### 1. 使用 --cards-file 参数导致卡片位置错误
**问题**：使用 --cards-file 参数直接指定卡片文件时，卡片会被添加到默认牌组（系统默认）而不是指定的牌组中

**原因**：当使用 --cards-file 参数时，脚本会读取文件内容但不会使用 --reference-dir 信息，导致卡片位置错误

**解决方法**：
- 确保使用正确的参数组合
- 如果需要指定文件，请确保在正确的目录结构中
- 或者，使用 --reference-dir 参数并确保目录下有 cards_data.json 文件

### 2. 卡片重复错误
**问题**：添加卡片时出现 "cannot create note because it is a duplicate" 错误

**原因**：AnkiConnect 检测到相同内容的卡片已存在

**解决方法**：
- 使用 `--no-delete` 参数保留现有卡片
- 确保只添加新内容
- 使用 findNotes 命令查找重复卡片

### 3. 目录结构问题
**问题**：创建的目录结构与预期不符，导致找不到卡片文件

**原因**：参考目录的创建与卡片文件的命名需要遵循约定

**解决方法**：
- 使用标准的目录结构：`references/牌组名称/主题名称/cards_data.json`
- 确保卡片文件名使用正确的字符
- 避免使用包含空格或特殊字符的文件名

### 4. 同步问题
**问题**：添加卡片后，在 Anki 客户端中看不到更新

**原因**：没有执行云同步

**解决方法**：
- 使用 `invoke("sync")` 命令执行同步
- 在 Anki 客户端中手动同步
- 确保网络连接正常

### HTML 标签转义
- 使用 `<b>` 加粗关键词
- 使用 `<code>` 包裹代码
- 使用 `<br>` 换行
- 注意特殊字符转义

### 字符处理
- 中文引号需转义或使用英文引号
- 避免 Python 字符串中的语法错误

### 字段规范
- Back 字段：简短的核心答案，不要长篇大论
- Example 字段：提供具体可理解的示例
- Extra 字段：补充原理或注意事项
