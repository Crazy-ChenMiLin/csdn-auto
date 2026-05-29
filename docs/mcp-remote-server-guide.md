# 如何通过 MCP 访问远程服务器

本文档介绍如何在 OpenClaw 中配置 MCP (Model Context Protocol) 以访问远程服务器。

## 什么是 MCP？

MCP (Model Context Protocol) 是一种标准化的协议，允许 AI 助手通过工具服务器与外部系统进行交互。通过 MCP，你可以：

- 连接远程数据库
- 操作远程应用程序（如 Anki）
- 访问远程 API 服务
- 执行远程命令

## 配置结构

MCP 配置位于 `openclaw.json` 文件的 `mcp` 字段中：

```json
{
  "mcp": {
    "servers": {
      "<服务器名称>": {
        "command": "<启动命令>",
        "args": ["<参数1>", "<参数2>", ...],
        "env": {
          "<环境变量名>": "<环境变量值>"
        }
      }
    }
  }
}
```

### 配置字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `command` | ✅ | 启动 MCP 服务器的命令（如 `npx`、`node`、`python`） |
| `args` | ✅ | 传递给命令的参数数组 |
| `env` | ❌ | 可选的环境变量配置 |

## 示例：配置远程 Anki 服务器

以下是一个完整的配置示例，展示如何连接到远程 Anki 服务器：

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

### 配置解析

- **command**: `npx` - 使用 Node.js 包执行器
- **args**:
  - `-y` - 自动确认 npx 安装提示
  - `anki-mcp-server` - MCP 服务器包名
  - `--url` - 指定远程服务器地址的参数
  - `http://47.108.66.230:8765` - 远程 AnkiConnect 服务地址

## 常见 MCP 服务器配置示例

### 1. 远程数据库连接

```json
{
  "mcp": {
    "servers": {
      "postgres": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-postgres",
          "postgresql://user:password@remote-host:5432/dbname"
        ]
      }
    }
  }
}
```

### 2. 远程文件系统

```json
{
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "/path/to/remote/directory"
        ]
      }
    }
  }
}
```

### 3. 自定义 MCP 服务器

```json
{
  "mcp": {
    "servers": {
      "custom-server": {
        "command": "node",
        "args": ["/path/to/custom-mcp-server.js"],
        "env": {
          "API_KEY": "your-api-key",
          "REMOTE_URL": "https://api.example.com"
        }
      }
    }
  }
}
```

### 4. Python MCP 服务器

```json
{
  "mcp": {
    "servers": {
      "python-server": {
        "command": "python",
        "args": [
          "-m",
          "mcp_server",
          "--host",
          "remote-server.example.com",
          "--port",
          "8080"
        ]
      }
    }
  }
}
```

## 如何添加新的 MCP 服务器

### 方法一：手动编辑配置文件

1. 打开配置文件：
   ```bash
   nano ~/.openclaw/openclaw.json
   ```

2. 在 `mcp.servers` 中添加新服务器配置

3. 重启 OpenClaw 使配置生效

### 方法二：使用 gateway 工具（推荐）

通过 OpenClaw 的 `gateway` 工具进行配置更新：

```json
{
  "action": "config.patch",
  "patch": {
    "mcp": {
      "servers": {
        "new-server": {
          "command": "npx",
          "args": ["-y", "your-mcp-server", "--url", "http://remote-host:port"]
        }
      }
    }
  }
}
```

## 验证 MCP 服务器状态

配置完成后，可以通过以下方式验证：

1. **检查配置是否生效**：
   ```bash
   openclaw gateway status
   ```

2. **查看运行日志**：
   ```bash
   openclaw logs | grep mcp
   ```

3. **测试工具调用**：
   在对话中尝试使用 MCP 提供的工具，例如：
   > "使用 Anki 创建一张卡片"

## 安全注意事项

### 1. 网络安全

- 远程服务器应使用 HTTPS 而非 HTTP（如果支持）
- 考虑使用 VPN 或内网穿透工具保护连接
- 限制远程服务器的访问 IP 白名单

### 2. 认证信息

- 敏感信息（如 API Key、密码）应使用环境变量传递
- 不要在配置文件中明文存储密码
- 使用 OpenClaw 的密钥管理功能（如果可用）

### 3. 权限控制

- 仅授予 MCP 服务器必要的最小权限
- 定期审查 MCP 服务器的访问范围
- 监控 MCP 服务器的操作日志

## 故障排查

### MCP 服务器无法启动

**可能原因**：
- 命令路径不正确
- 依赖包未安装
- 端口被占用

**解决方法**：
```bash
# 手动测试 MCP 服务器
npx -y anki-mcp-server --url http://47.108.66.230:8765

# 检查网络连通性
curl http://47.108.66.230:8765
```

### 无法连接远程服务器

**可能原因**：
- 远程服务器未运行
- 防火墙阻止连接
- URL 配置错误

**解决方法**：
```bash
# 测试远程服务器连通性
ping 47.108.66.230
telnet 47.108.66.230 8765

# 检查防火墙规则
# (在远程服务器上执行)
sudo ufw status
```

### 工具调用超时

**可能原因**：
- 网络延迟过高
- 远程服务器响应慢
- 请求参数过大

**解决方法**：
- 检查网络质量
- 优化远程服务器性能
- 分批处理大量数据

## 最佳实践

1. **使用稳定的网络连接**：确保 OpenClaw 所在服务器与远程 MCP 服务器之间有稳定的网络连接

2. **配置健康检查**：定期检查远程服务器状态，及时发现连接问题

3. **日志记录**：启用 MCP 服务器的日志记录，便于问题排查

4. **版本管理**：锁定 MCP 服务器包的版本，避免自动更新导致的兼容性问题

5. **备份配置**：定期备份 `openclaw.json` 配置文件

## 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [OpenClaw 文档](https://docs.openclaw.ai)
- [Anki MCP Server](https://github.com/your-repo/anki-mcp-server)
- [MCP Servers 列表](https://github.com/modelcontextprotocol/servers)

---

*最后更新: 2026-05-19*
