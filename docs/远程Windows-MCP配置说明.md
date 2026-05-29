# 远程 Windows MCP 配置说明

## 概述

本文档说明如何通过 MCP (Model Context Protocol) 协议连接远程 Windows 服务器上的 Anki，实现远程制卡功能。

## 架构说明

```
┌─────────────────┐         HTTP          ┌──────────────────┐
│  OpenClaw 服务器 │ ──────────────────►  │  Windows 服务器   │
│  (Linux/Docker) │   47.108.66.230:8765  │   (Anki + 插件)   │
│                 │                       │                  │
│  - MCP Client   │                       │  - AnkiConnect   │
│  - anki-mcp     │                       │  - Anki 客户端    │
└─────────────────┘                       └──────────────────┘
```

## 实现原理

### 1. MCP 协议层
- **MCP Server**: `anki-mcp-server` (npm 包)
- **运行方式**: 通过 `npx` 启动，作为 MCP 服务器运行在 OpenClaw 进程中
- **通信方式**: stdio (标准输入输出)
- **作用**: 将 MCP 协议转换为 AnkiConnect HTTP API 调用

### 2. AnkiConnect 层
- **服务地址**: `http://47.108.66.230:8765`
- **协议**: HTTP JSON-RPC
- **作用**: Anki 插件，提供 HTTP API 接口操作 Anki 数据库

### 3. 数据流向
```
用户请求 → OpenClaw → MCP Client → anki-mcp-server (stdio) 
         → HTTP Request → AnkiConnect (Windows) → Anki 数据库
```

## 配置项详解

### 1. OpenClaw 配置 (`openclaw.json`)

```json
{
  "mcp": {
    "servers": {
      "anki": {
        "command": "npx",
        "args": [
          "-y",
          "anki-mcp-server",
          "--url",
          "http://47.108.66.230:8765"
        ]
      }
    }
  }
}
```

#### 配置项说明：

| 字段 | 说明 | 示例值 |
|------|------|--------|
| `mcp.servers.anki` | MCP 服务器名称，可自定义 | `"anki"` |
| `command` | 启动命令 | `"npx"` |
| `args[0]` | npx 参数，自动安装依赖 | `"-y"` |
| `args[1]` | MCP 服务器包名 | `"anki-mcp-server"` |
| `args[2]` | AnkiConnect URL 参数 | `"--url"` |
| `args[3]` | 远程 AnkiConnect 地址 | `"http://47.108.66.230:8765"` |

### 2. Windows 服务器配置

#### 2.1 安装 Anki
- 下载地址: https://apps.ankiweb.net/
- 版本要求: Anki 2.1+

#### 2.2 安装 AnkiConnect 插件
1. 打开 Anki
2. 工具 → 插件 → 获取插件
3. 输入代码: `2055492159`
4. 重启 Anki

#### 2.3 配置 AnkiConnect
编辑插件配置 (工具 → 插件 → AnkiConnect → 配置):

```json
{
  "webBindAddress": "0.0.0.0",
  "webBindPort": 8765,
  "webUrlPrefix": "http://127.0.0.1:8765",
  "corsOrigin": "*"
}
```

**重要配置项：**
- `webBindAddress`: 必须设为 `"0.0.0.0"` 才能接受外部连接
- `webBindPort`: 默认 8765，可自定义
- `corsOrigin`: 设为 `"*"` 允许跨域请求

#### 2.4 防火墙配置
Windows 防火墙需要放行 8765 端口：

```powershell
# PowerShell (管理员)
New-NetFirewallRule -DisplayName "AnkiConnect" -Direction Inbound -Port 8765 -Protocol TCP -Action Allow
```

#### 2.5 云服务器安全组
如果是云服务器（如阿里云），需要在安全组中放行 8765 端口：
- 协议: TCP
- 端口: 8765
- 授权对象: 0.0.0.0/0 (或指定 IP)

## MCP 工具列表

通过 `anki-mcp-server` 提供的工具：

| 工具名称 | 功能 | 参数 |
|---------|------|------|
| `mcp_anki_add_note` | 添加卡片 | deckName, modelName, fields, tags |
| `mcp_anki_find_notes` | 查找卡片 | query (搜索条件) |
| `mcp_anki_delete_notes` | 删除卡片 | notes (卡片 ID 列表) |
| `mcp_anki_update_note` | 更新卡片 | id, fields |
| `mcp_anki_sync` | 云同步 | 无 |
| `mcp_anki_get_decks` | 获取牌组列表 | 无 |
| `mcp_anki_get_models` | 获取模板列表 | 无 |

## 使用示例

### 1. 添加卡片
```python
# 通过 MCP 调用
mcp_anki_add_note(
    deckName="系统默认",
    modelName="ai",
    fields={
        "Front": "什么是 Redis？",
        "Back": "Redis 是一个开源的内存数据结构存储系统",
        "Example": "缓存、会话存储、消息队列",
        "Extra": "支持多种数据结构：String、Hash、List、Set 等",
        "Source": "Redis 官方文档"
    },
    tags=["Redis", "缓存", "数据库"]
)
```

### 2. 查找并删除卡片
```python
# 查找所有 Redis 标签的卡片
notes = mcp_anki_find_notes(query="tag:Redis")

# 删除这些卡片
mcp_anki_delete_notes(notes=notes)
```

### 3. 云同步
```python
# 同步到 AnkiWeb
mcp_anki_sync()
```

## 技术细节

### anki-mcp-server 包信息
- **npm 包名**: `anki-mcp-server`
- **版本**: 0.1.8
- **依赖**:
  - `@modelcontextprotocol/sdk`: 1.18.2 (MCP SDK)
  - `axios`: 1.12.1 (HTTP 客户端)
  - `yanki-connect`: 3.0.5 (AnkiConnect 客户端)
- **GitHub**: https://github.com/nailuoGG/anki-mcp-server

### MCP 协议版本
- **协议版本**: Model Context Protocol 2024-11-05
- **传输方式**: stdio (标准输入输出)
- **消息格式**: JSON-RPC 2.0

### AnkiConnect API 版本
- **最低版本**: 6
- **协议**: HTTP JSON-RPC
- **默认端口**: 8765

## 安全建议

### 1. 网络安全
- ⚠️ 当前配置允许任意 IP 访问，建议限制来源 IP
- 可在 AnkiConnect 配置中设置 `corsOrigin` 为指定域名
- 云服务器安全组应限制来源 IP

### 2. 认证机制
- AnkiConnect 默认无认证
- 可通过 AnkiConnect 配置添加 API Key（需修改插件配置）

### 3. 数据安全
- 定期备份 Anki 数据库
- 使用 AnkiWeb 同步作为异地备份

## 故障排查

### 1. 连接失败
```
Error: connect ECONNREFUSED 47.108.66.230:8765
```
**检查项：**
- Anki 是否在 Windows 服务器上运行
- AnkiConnect 插件是否已安装并启用
- 防火墙是否放行 8765 端口
- 云服务器安全组是否配置正确

### 2. MCP 启动失败
```
Failed to send tools list changed notification
```
**说明：** 这是 anki-mcp-server 的已知警告，不影响功能使用

### 3. 卡片添加失败
```
cannot create note because it is a duplicate
```
**解决方法：**
- 先删除重复卡片，或使用不同的内容
- 检查是否已存在相同 Front 字段的卡片

## 相关文档

- [Anki 官网](https://apps.ankiweb.net/)
- [AnkiConnect 插件](https://ankiweb.net/shared/info/2055492159)
- [anki-mcp-server GitHub](https://github.com/nailuoGG/anki-mcp-server)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [OpenClaw 文档](https://docs.openclaw.ai)

---

**最后更新**: 2026-05-19
**维护者**: 米林的小助手
