# chenmilin.xyz 网站 502 错误诊断报告

**报告时间**: 2026-05-20 19:05 (GMT+8)
**诊断人员**: 米林的小助手
**服务器**: 146.56.102.26 (1Panel 控制面板)

---

## 问题概述

**网站**: https://chenmilin.xyz
**错误**: 502 Bad Gateway
**影响**: 用户无法访问单词谐音助记生成器

---

## 诊断过程

### 1. 检查网站配置

通过 1Panel 控制面板查看网站配置：

- **网站类型**: 反向代理
- **前端请求路径**: `/`（根路径）
- **后端代理地址**: `http://127.0.0.1:5001`
- **备注**: word-helper

### 2. 检查后端服务状态

```bash
netstat -tlnp | grep 5001
# 结果：无输出，说明 5001 端口没有服务监听
```

### 3. 定位项目文件

```bash
find /opt /root /home -name "*word*" -o -name "*helper*" 2>/dev/null
# 发现项目位于：/opt/1panel/apps/openlist/openlist/opt/word_app/
```

### 4. 检查项目目录

```bash
ls -la /opt/1panel/apps/openlist/openlist/opt/word_app/
```

项目结构：
```
total 100
drwxr-xr-x 5 root root 4096 Mar 16 13:23 .
drwxr-xr-x 3 root root 4096 Mar 16 09:55 ..
-rwxr-xr-x 1 root root 4334 Mar 16 13:29 app.py       # Flask 主程序
-rw-r--r-- 1 root root 63272 Mar 16 20:33 output.log   # 日志文件
-rwxr-xr-x 1 root root 42 Mar 16 09:57 requirements.txt
drwxr-xr-x 4 root root 4096 Mar 16 13:24 static/
drwxr-xr-x 2 root root 4096 Mar 16 10:03 templates/
drwxr-xr-x 5 root root 4096 Mar 16 10:15 venv/         # Python 虚拟环境
```

---

## 根因分析

### 直接原因

**Flask 应用未运行** - 后端服务 `127.0.0.1:5001` 没有启动，导致 OpenResty 反向代理无法连接，返回 502 错误。

### 可能的间接原因

1. **服务器重启后服务未自动启动**
   - 项目使用 `nohup python app.py` 方式运行，不是持久化服务
   - 服务器重启后进程会丢失

2. **进程意外终止**
   - 可能因内存不足、错误崩溃等原因停止
   - 查看日志文件 `output.log` 可确认具体原因

3. **缺少进程守护机制**
   - 未配置 systemd 服务
   - 未使用 PM2 或 supervisor 等进程管理工具
   - 未添加到 1Panel 的计划任务或容器管理

---

## 解决方案

### 临时解决（已执行）

```bash
cd /opt/1panel/apps/openlist/openlist/opt/word_app
source venv/bin/activate
nohup python app.py > output.log 2>&1 &
```

**验证结果**:
```bash
netstat -tlnp | grep 5001
# tcp  0  0 0.0.0.0:5001  0.0.0.0:*  LISTEN  389668/python
```

✅ 服务已启动，网站恢复正常访问

---

### 长期解决方案（建议）

#### 方案一：创建 systemd 服务

创建服务文件 `/etc/systemd/system/word-helper.service`:

```ini
[Unit]
Description=Word Helper - 单词谐音助记生成器
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/1panel/apps/openlist/openlist/opt/word_app
ExecStart=/opt/1panel/apps/openlist/openlist/opt/word_app/venv/bin/python app.py
Restart=always
RestartSec=5
StandardOutput=append:/opt/1panel/apps/openlist/openlist/opt/word_app/output.log
StandardError=append:/opt/1panel/apps/openlist/openlist/opt/word_app/output.log

[Install]
WantedBy=multi-user.target
```

启用服务：
```bash
systemctl daemon-reload
systemctl enable word-helper
systemctl start word-helper
```

#### 方案二：使用 PM2 管理

```bash
# 安装 PM2（需要先安装 Node.js）
npm install -g pm2

# 启动服务
pm2 start /opt/1panel/apps/openlist/openlist/opt/word_app/app.py --interpreter python3

# 保存进程列表
pm2 save
pm2 startup
```

#### 方案三：添加到 1Panel 计划任务

在 1Panel 控制面板中：
1. 进入「计划任务」
2. 创建任务类型：Shell 脚本
3. 执行周期：@reboot（开机启动）
4. 脚本内容：
```bash
cd /opt/1panel/apps/openlist/openlist/opt/word_app
source venv/bin/activate
nohup python app.py > output.log 2>&1 &
```

---

## 建议改进

### 1. 监控告警

- 配置端口监控，当 5001 端口无服务时自动告警
- 可使用 1Panel 的「计划任务」定期检查服务状态

### 2. 日志轮转

当前日志文件 `output.log` 已有 63KB，建议配置日志轮转避免文件过大：
```bash
# 创建日志轮转配置
cat > /etc/logrotate.d/word-helper << EOF
/opt/1panel/apps/openlist/openlist/opt/word_app/output.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF
```

### 3. 健康检查脚本

创建健康检查脚本，定期检测服务状态并自动重启：

```bash
#!/bin/bash
# 文件: /opt/scripts/check_word_helper.sh

if ! netstat -tlnp | grep -q ":5001"; then
    echo "[WARN] word-helper 服务未运行，正在重启..."
    cd /opt/1panel/apps/openlist/openlist/opt/word_app
    source venv/bin/activate
    nohup python app.py > output.log 2>&1 &
    echo "[INFO] 服务已重启"
fi
```

添加到计划任务，每 5 分钟检查一次。

---

## 附录

### 相关文件位置

| 文件/目录 | 路径 |
|----------|------|
| 项目目录 | `/opt/1panel/apps/openlist/openlist/opt/word_app/` |
| 主程序 | `app.py` |
| 日志文件 | `output.log` |
| 虚拟环境 | `venv/` |
| 静态文件 | `static/` |
| 模板文件 | `templates/` |

### 服务器信息

| 项目 | 信息 |
|-----|------|
| 主机名 | ubuntu |
| 发行版本 | Ubuntu 24.04.3 LTS |
| 内核版本 | 6.17.0-1011-oracle |
| 系统类型 | aarch64 (ARM64) |
| 运行时间 | 13天 23小时 |
| 控制面板 | 1Panel 社区版 v2.1.12 |
| Web 服务器 | OpenResty 1.27.1.2 |

---

**报告结束**

*如有疑问或需要进一步协助，请联系米林的小助手*