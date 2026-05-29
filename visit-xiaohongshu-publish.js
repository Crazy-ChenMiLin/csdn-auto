const { chromium } = require('playwright');
const fs = require('fs');

async function visitXiaohongshuPublish() {
  const url = 'https://creator.xiaohongshu.com/publish/publish?from=homepage&target=image&openFilePicker=true';
  const currentTime = new Date().toISOString();

  // 用户提供的Cookie信息
  const cookies = [
    {
      "name": "loadts",
      "value": "1778036670150",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809572670,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "xsecappid",
      "value": "ugc",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1809572670,
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
      "value": "3633fe24d49c7dd0eb923edc8205740f10fdb18b25d424d2a2322c6196d2a4ad",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1778295868,
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
      "expires": undefined,
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
      "value": "8a04353d-ec1f-491a-914c-5b329904fc3a",
      "domain": ".xiaohongshu.com",
      "path": "/",
      "expires": 1778037273,
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
      "expires": 1812596684.885307,
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
      "value": "0a00077317780366569314130e3fa7b4b4990ec3eff645005d2cf2ce9328b7",
      "domain": "creator.xiaohongshu.com",
      "path": "/",
      "expires": 1778038464.906532,
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
      "expires": undefined,
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
    console.log(`${currentTime} - 开始访问小红书创作者后台发布页面 ${url}`);
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const context = await browser.newContext();
    
    // 设置Cookie
    await context.addCookies(cookies);
    
    const page = await context.newPage();

    // 设置视口大小，确保截图完整
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 访问小红书创作者后台发布页面
    const startTime = Date.now();
    const response = await page.goto(url, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });
    const loadTime = Date.now() - startTime;

    if (!response || response.status() !== 200) {
      const errorMessage = `${currentTime} - 访问失败，状态码: ${response?.status() || '无响应'}`;
      console.error(errorMessage);
      await browser.close();
      return;
    }

    console.log(`${currentTime} - 访问成功，状态码: ${response.status()}`);
    console.log(`${currentTime} - 加载时间: ${loadTime}ms`);

    // 检查页面标题
    const title = await page.title();
    console.log(`${currentTime} - 页面标题: ${title}`);

    // 等待页面内容加载
    await page.waitForTimeout(3000);

    // 保存页面截图
    await page.screenshot({ 
      path: `xiaohongshu-publish-page-${currentTime.replace(/[:.]/g, '-')}.png`,
      fullPage: true
    });

    // 检查是否有文件选择器元素
    const fileInputSelector = 'input[type="file"]';
    try {
      const fileInput = await page.$(fileInputSelector);
      if (fileInput) {
        console.log(`${currentTime} - 文件选择器元素找到`);
        
        // 准备一个测试图片（创建一个简单的PNG图片）
        const testImagePath = '/tmp/test-image.png';
        await createTestImage(testImagePath);
        
        // 上传测试图片
        await page.setInputFiles(fileInputSelector, testImagePath);
        console.log(`${currentTime} - 图片上传成功`);
        
        // 等待图片上传完成
        await page.waitForTimeout(5000);
        
        // 保存上传后的页面截图
        await page.screenshot({ 
          path: `xiaohongshu-publish-uploaded-${currentTime.replace(/[:.]/g, '-')}.png`,
          fullPage: true
        });
        
        // 删除测试图片
        fs.unlinkSync(testImagePath);
      } else {
        console.log(`${currentTime} - 文件选择器元素未找到`);
      }
    } catch (error) {
      console.error(`${currentTime} - 文件上传操作失败: ${error.message}`);
    }

    await browser.close();

  } catch (error) {
    const errorMessage = `${currentTime} - 访问失败: ${error.message}`;
    console.error(errorMessage);
  }
}

// 创建一个简单的测试图片
async function createTestImage(filePath) {
  // 创建一个1x1的红色PNG图片
  const pngData = Buffer.from(
    '89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex'
  );
  
  fs.writeFileSync(filePath, pngData);
}

// 立即执行
visitXiaohongshuPublish().catch(error => console.error('访问失败:', error));
