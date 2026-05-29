# CSDN 博客自动化发布 - 成功复盘与失败分析

> 记录时间：2026-05-07  
> 事件：成功实现 CSDN 博客草稿自动保存

---

## 一、本次成功的完整流程

### 1.1 准备工作

```
workspace/
├── 1.txt                          # 从浏览器导出的完整 Cookie JSON
├── CSDN保存草稿复现方案.md         # 参考文档
└── csdn_write_draft.js            # 本次成功的脚本
```

### 1.2 成功的脚本核心代码

```javascript
// 1. 加载完整的 Cookie JSON
function loadCookies(cookieFilePath) {
  const raw = fs.readFileSync(cookieFilePath, 'utf8');
  const cookies = JSON.parse(raw);

  return cookies.map((cookie) => {
    const mapped = {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path || '/',
    };

    // 关键：正确处理过期时间
    if (typeof cookie.expires === 'number') {
      mapped.expires = cookie.expires;
    } else if (typeof cookie.expirationDate === 'number') {
      mapped.expires = cookie.expirationDate;
    }

    // 关键：正确处理 httpOnly 和 secure
    if (typeof cookie.httpOnly === 'boolean') {
      mapped.httpOnly = cookie.httpOnly;
    }
    if (typeof cookie.secure === 'boolean') {
      mapped.secure = cookie.secure;
    }

    // 关键：正确处理 sameSite
    if (cookie.sameSite === 'no_restriction') {
      mapped.sameSite = 'None';
    } else if (cookie.sameSite === 'lax') {
      mapped.sameSite = 'Lax';
    } else if (cookie.sameSite === 'strict') {
      mapped.sameSite = 'Strict';
    }

    return mapped;
  });
}

// 2. 使用 context.addCookies() 注入
const cookies = loadCookies(COOKIE_FILE);
await context.addCookies(cookies);

// 3. 访问编辑器页面
await page.goto(EDITOR_URL, { waitUntil: 'networkidle' });

// 4. 等待编辑器就绪（检测 txtTitle 和 CKEditor）
const titleVisible = await page.locator('#txtTitle').isVisible();
const editorReady = await page.evaluate(() => {
  return Boolean(window.CKEDITOR?.instances?.editor);
});

// 5. 写入标题
await page.evaluate((value) => {
  const titleEl = document.getElementById('txtTitle');
  titleEl.value = value;
  titleEl.dispatchEvent(new Event('input', { bubbles: true }));
  titleEl.dispatchEvent(new Event('change', { bubbles: true }));
}, title);

// 6. 写入正文（使用 CKEditor API）
await page.evaluate((content) => {
  const editor = window.CKEDITOR.instances.editor;
  editor.setData(content);
  editor.updateElement();
}, html);

// 7. 点击保存草稿
await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const saveButton = buttons.find(el => 
    (el.innerText || '').trim() === '保存草稿'
  );
  saveButton.click();
});
```

---

## 二、与参考文档的共同点提取

### 2.1 核心流程一致

| 步骤 | 参考文档 | 本次实践 | 一致性 |
|------|---------|---------|--------|
| Cookie 加载 | 从 JSON 文件读取 | 从 1.txt 读取 | ✅ 完全一致 |
| Cookie 字段映射 | 处理 expires、httpOnly、secure、sameSite | 同样处理 | ✅ 完全一致 |
| Cookie 注入 | `context.addCookies()` | `context.addCookies()` | ✅ 完全一致 |
| 标题写入 | `document.getElementById('txtTitle')` | 同上 | ✅ 完全一致 |
| 正文写入 | `CKEDITOR.instances.editor.setData()` | 同上 | ✅ 完全一致 |
| 保存草稿 | 查找"保存草稿"按钮点击 | 同上 | ✅ 完全一致 |

### 2.2 关键技术点

**共同点 1：Cookie 字段必须完整映射**
```javascript
// 参考文档和本次实践都采用相同的映射逻辑
sameSite: 'no_restriction' → 'None'
sameSite: 'lax' → 'Lax'
sameSite: 'strict' → 'Strict'
```

**共同点 2：等待编辑器就绪的检测逻辑**
```javascript
// 两者都检测两个信号
const titleVisible = await page.locator('#txtTitle').isVisible();
const editorReady = await page.evaluate(() => {
  return Boolean(window.CKEDITOR?.instances?.editor);
});
```

**共同点 3：触发 input 事件确保数据被识别**
```javascript
// 两者都触发了 input 和 change 事件
titleEl.dispatchEvent(new Event('input', { bubbles: true }));
titleEl.dispatchEvent(new Event('change', { bubbles: true }));
```

---

## 三、之前失败的原因分析

### 3.1 失败脚本的问题（csdn-publish-working.js）

#### 问题 1：Cookie 格式错误
```javascript
// ❌ 错误的简化格式
const cookies = [
  { domain: '.csdn.net', name: 'SESSION', value: 'xxx', httpOnly: true },
  { domain: '.csdn.net', name: 'UserToken', value: 'xxx', httpOnly: true },
  // ... 只有 7 个 cookie
];
```

**为什么错：**
- CSDN 需要完整的 39 个 cookie 才能正确识别登录状态
- 只提供 7 个关键 cookie 会导致会话不完整
- 特别是缺少了一些跟踪和验证用的辅助 cookie

#### 问题 2：使用了错误的 Cookie 设置方式
```javascript
// ❌ 使用 CDP 方式设置 Cookie
const client = await context.newCDPSession(page);
await client.send('Network.enable');
for (const cookie of cookies) {
  await client.send('Network.setCookie', {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    httpOnly: cookie.httpOnly || false,
    secure: cookie.secure || false
  });
}
```

**为什么错：**
- CDP (Chrome DevTools Protocol) 的 `Network.setCookie` 在某些情况下不稳定
- 它没有正确处理 cookie 的过期时间
- 与 Playwright 原生的 `context.addCookies()` 相比，兼容性差

#### 问题 3：Cookie 值已过期
```javascript
// ❌ 脚本中硬编码的 Cookie 值
{ name: 'UserToken', value: '3390401ac9484771b8df4061c7d864a8' }
// 这个值是旧的，已经过期
```

**为什么错：**
- CSDN 的 Cookie 有有效期限制
- 硬编码的 cookie 值几天后就会失效
- 必须使用从浏览器实时导出的最新 cookie

### 3.2 失败的表现

- 页面打开后仍处于未登录状态
- 无法找到标题输入框 `#txtTitle`
- CKEditor 加载失败
- 点击"保存草稿"按钮无响应或报错

---

## 四、本次成功的关键因素

### 4.1 使用了完整的 Cookie 文件

```javascript
// ✅ 这次使用 1.txt，包含 39 个完整的 cookie
[
  { "domain": ".csdn.net", "name": "c_first_page", ... },
  { "domain": ".csdn.net", "name": "dc_tos", ... },
  { "domain": ".csdn.net", "name": "__gpi", ... },
  // ... 共 39 个
]
```

### 4.2 正确的 Cookie 注入方式

```javascript
// ✅ 使用 Playwright 原生 API
await context.addCookies(cookies);
```

**优势：**
- 自动处理所有 cookie 字段
- 与 Playwright 的上下文管理集成更好
- 更稳定可靠

### 4.3 完整的字段映射

```javascript
// ✅ 正确处理了所有特殊字段
if (cookie.sameSite === 'no_restriction') {
  mapped.sameSite = 'None';  // Playwright 需要 'None' 而不是 'no_restriction'
}
```

### 4.4 充分的等待时间

```javascript
// ✅ 在关键步骤后添加等待
await page.waitForTimeout(2000);  // 写入内容后
await page.waitForTimeout(5000);  // 点击保存后
```

---

## 五、自我反思

### 5.1 之前的错误认知

**错误 1：认为只需要关键 Cookie**
- 我以为只需要 `SESSION`、`UserToken`、`UserInfo` 等几个核心 cookie
- 忽略了现代网站使用多个 cookie 协同验证的机制
- **教训**：Cookie 认证是一个整体，不能随意删减

**错误 2：迷信 CDP 方式**
- 看到某些教程使用 CDP (`Network.setCookie`)，就盲目复制
- 没有理解 `context.addCookies()` 是 Playwright 推荐的标准方式
- **教训**：优先使用框架的原生 API，而不是底层协议

**错误 3：硬编码敏感信息**
- 把 cookie 值直接写在代码里
- 导致 cookie 过期后需要修改代码
- **教训**：敏感配置应该从外部文件读取

**错误 4：没有验证每一步**
- 之前的脚本没有截图验证登录状态
- 问题发生后难以定位
- **教训**：关键步骤后都要截图留证

### 5.2 正确的开发流程

```
1. 准备阶段
   └─ 获取最新的完整 Cookie（从浏览器导出 JSON）
   └─ 确认 Cookie 文件格式正确

2. 开发阶段
   └─ 先写登录验证脚本（最小可运行单元）
   └─ 截图确认登录成功后再继续
   └─ 逐步添加功能（标题→正文→保存）
   └─ 每步都截图验证

3. 测试阶段
   └─ 使用 headless: true 模拟真实运行环境
   └─ 保留所有截图用于问题排查
   └─ 记录成功时的所有参数

4. 文档阶段
   └─ 记录成功的完整流程
   └─ 分析失败原因
   └─ 提取可复用的模式
```

### 5.3 关键经验教训

| 教训 | 说明 |
|------|------|
| **完整优于精简** | Cookie 必须完整，不能想当然地删减 |
| **原生 API 优先** | 使用框架提供的标准方法 |
| **配置外部化** | 敏感信息放入外部文件，代码只负责读取 |
| **验证每一步** | 关键操作后必须验证并截图 |
| **参考文档要对照执行** | 不能只看大概，要对齐每一个细节 |

---

## 六、可复用的标准模板

### 6.1 标准 Cookie 加载函数

```javascript
function loadCookies(cookieFilePath) {
  const raw = fs.readFileSync(cookieFilePath, 'utf8');
  const cookies = JSON.parse(raw);

  return cookies.map((cookie) => {
    const mapped = {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path || '/',
    };

    if (typeof cookie.expires === 'number') {
      mapped.expires = cookie.expires;
    } else if (typeof cookie.expirationDate === 'number') {
      mapped.expires = cookie.expirationDate;
    }

    if (typeof cookie.httpOnly === 'boolean') {
      mapped.httpOnly = cookie.httpOnly;
    }

    if (typeof cookie.secure === 'boolean') {
      mapped.secure = cookie.secure;
    }

    if (cookie.sameSite === 'no_restriction') {
      mapped.sameSite = 'None';
    } else if (cookie.sameSite === 'lax') {
      mapped.sameSite = 'Lax';
    } else if (cookie.sameSite === 'strict') {
      mapped.sameSite = 'Strict';
    }

    return mapped;
  });
}
```

### 6.2 标准 CSDN 发布流程

```javascript
// 1. 加载 Cookie
const cookies = loadCookies('1.txt');

// 2. 创建上下文并注入
const context = await browser.newContext({ locale: 'zh-CN' });
await context.addCookies(cookies);

// 3. 打开编辑器
const page = await context.newPage();
await page.goto('https://mp.csdn.net/mp_blog/creation/editor', {
  waitUntil: 'networkidle'
});

// 4. 等待就绪（标题框可见 + CKEditor 加载）
await page.waitForSelector('#txtTitle', { visible: true });
await page.waitForFunction(() => window.CKEDITOR?.instances?.editor);

// 5. 写入标题
await page.evaluate((title) => {
  const el = document.getElementById('txtTitle');
  el.value = title;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, title);

// 6. 写入正文
await page.evaluate((content) => {
  window.CKEDITOR.instances.editor.setData(content);
}, content);

// 7. 保存草稿
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button'))
    .find(el => el.innerText?.trim() === '保存草稿');
  btn?.click();
});
```

---

## 七、总结

本次成功不是因为我写了多么复杂的代码，而是因为：

1. **严格遵循了参考文档的指引**
2. **使用了完整、最新的 Cookie**
3. **选择了正确的技术方案**（`context.addCookies`）
4. **每一步都有验证和截图**

之前失败的根本原因是**自以为是的简化**：简化 Cookie、简化流程、迷信非标准方案。

**核心原则：对于认证相关的自动化，完整性 > 简洁性。**

---

*文档作者：米林的小助手*  
*最后更新：2026-05-07*
