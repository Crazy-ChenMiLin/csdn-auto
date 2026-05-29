const { chromium } = require('playwright');
const fs = require('fs');

async function visitPublishWithNewestCookie() {
  const publishUrl = 'https://creator.xiaohongshu.com/publish/publish?from=homepage&target=image&openFilePicker=true';
  const currentTime = new Date().toISOString();

  // 使用用户提供的最新Cookie信息
  const cookies = [
    {
      "name": "loadts",
      "value": "1778040070779",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809576070,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "xsecappid",
      "value": "ugc",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809576070,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "x-user-id-creator.xiaohongshu.com",
      "value": "6560c08700000000040387c9",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1812596668.556562,
      "httpOnly": true,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "websectiga",
      "value": "10f9a40ba454a07755a08f27ef8194c53637eba4551cf9751c009d9afb564467",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1778299106,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "galaxy_creator_session_id",
      "value": "lCMADDviEr8Te6vMxKGhkcxHm0U0vyI3Vq44",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1780628668.556788,
      "httpOnly": true,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "webBuild",
      "value": "6.8.1",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 0,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "galaxy.creator.beaker.session.id",
      "value": "1778036660563017102319",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1780628668.556862,
      "httpOnly": true,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "sec_poison_id",
      "value": "f71308ef-37b9-43d2-9e87-2ec3089f966a",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1778040511,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "web_session",
      "value": "040069b41483cf41d79f3858c63b4b315040f2",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809073106.007722,
      "httpOnly": true,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "gid",
      "value": "yjfffWKfidIyyjfffWKf8JKEf0dx1Y1flhYAjVhDVEW6lS28jiUMFE888488Y4K8qjdWidii",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1812600074.312211,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "a1",
      "value": "19ddd76d0daehl8ldov8qbjw7mo9fpsrn29cw6wjv50000400846",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809073044,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "abRequestId",
      "value": "c6a4a24f-a3ba-5504-9788-36c4af8b7a79",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809073043.607844,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "access-token-creator.xiaohongshu.com",
      "value": "customer.creator.AT-68c5176366093059541565523vtck1uftepkrrur",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1780628667.55671,
      "httpOnly": true,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "acw_tc",
      "value": "0a00071717780400531703865ebe5fcabd72931f67729322d5f3126a52c4e1",
      "domain": "creator.xiaohongshu.com",
      "path": "/",
      "expires": 1778041861.104133,
      "httpOnly": true,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "customer-sso-sid",
      "value": "68c517636609305954156550fdl9ygu3j5hrlcky",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1778641467.556468,
      "httpOnly": true,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "customerClientId",
      "value": "807747911377920",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1812596668.556639,
      "httpOnly": true,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "ets",
      "value": "1777537044599",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1780129044.59926,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "id_token",
      "value": "VjEAAHkd5QgHtWQr4nQ4ptiqGwxbF/7Sp+UOJLDVhp0WB3Wo2+5DD75+whxoC+qnAfjxhzqiKc4jMll4i2SSDb5GrN6EN8pD+6rmB5Vc2AmpYRKo4g0h05pAeTJt1C4Mf9dfoH7k",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809073106.007962,
      "httpOnly": true,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "unread",
      "value": "{%22ub%22:%2269d47593000000002102cb29%22%2C%22ue%22:%2269ef47c70000000035022386%22%2C%22uc%22:24}",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 0,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "webId",
      "value": "54db9eb12dc0a7266c054357e61077dc",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809073044,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    }
  ];

  try {
    console.log(`${currentTime} - 使用最新Cookie访问小红书发布页面 ${publishUrl}`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: false
    });
    
    // 设置Cookie
    await context.addCookies(cookies);
    
    const page = await context.newPage();

    // 访问发布页面
    const response = await page.goto(publishUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    // 等待页面加载完成
    await page.waitForTimeout(8000);

    // 保存页面截图
    await page.screenshot({ 
      path: `publish-page-newest-cookie-${currentTime.replace(/[:.]/g, '-')}.png`,
      fullPage: true
    });

    // 检查页面是否需要登录
    const isLoginPage = await page.evaluate(() => {
      return document.querySelector('.login-container') !== null || 
             document.body.innerText.includes('登录') || 
             document.body.innerText.includes('手机号');
    });

    if (isLoginPage) {
      console.log(`${currentTime} - 页面仍需要登录，Cookie可能无效`);
    } else {
      console.log(`${currentTime} - 已成功登录，可以访问发布页面`);
      
      // 查找文本输入框
      const textInputs = await page.$$('textarea, input[type="text"], [contenteditable="true"]');
      console.log(`${currentTime} - 找到文本输入元素数量: ${textInputs.length}`);
      
      if (textInputs.length > 0) {
        // 尝试在第一个可编辑元素中输入文字
        const firstInput = textInputs[0];
        
        // 尝试点击输入框
        await firstInput.click();
        await page.waitForTimeout(1000);
        
        // 输入一些文字
        const text = `这是一个测试内容，用于验证小红书发布页面的文字输入功能。${new Date().toLocaleString()}`;
        
        // 尝试输入文字
        try {
          await firstInput.fill(text);
          console.log(`${currentTime} - 成功输入文字: ${text}`);
          
          // 等待输入完成
          await page.waitForTimeout(2000);
          
          // 保存输入后的页面截图
          await page.screenshot({ 
            path: `publish-page-text-input-${currentTime.replace(/[:.]/g, '-')}.png`,
            fullPage: true
          });
          
        } catch (fillError) {
          console.log(`${currentTime} - 无法直接使用fill方法，尝试使用输入事件`);
          
          try {
            await firstInput.focus();
            await page.keyboard.type(text);
            console.log(`${currentTime} - 使用键盘输入文字成功: ${text}`);
            
            // 等待输入完成
            await page.waitForTimeout(2000);
            
            // 保存输入后的页面截图
            await page.screenshot({ 
              path: `publish-page-keyboard-input-${currentTime.replace(/[:.]/g, '-')}.png`,
              fullPage: true
            });
            
          } catch (keyboardError) {
            console.log(`${currentTime} - 键盘输入也失败: ${keyboardError.message}`);
          }
        }
      } else {
        console.log(`${currentTime} - 未找到可编辑的文本输入元素`);
      }
    }

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
  }
}

// 立即执行
visitPublishWithNewestCookie().catch(error => console.error('访问失败:', error));
