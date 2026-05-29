const { chromium } = require('playwright');
const fs = require('fs');

async function checkPublishForm() {
  const targetUrl = 'https://creator.douyin.com/creator-micro/content/post/image-text?enter_from=publish_page&media_type=image&type=new';
  const currentTime = new Date().toISOString();

  const cookies = [
    {
      "name": "__security_server_data_status",
      "value": "1",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1783225370.249341,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "sessionid",
      "value": "acbe0245f71fd900f4783665c5b7ae18",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1783225369.573804,
      "httpOnly": true,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "ttwid",
      "value": "1%7CSnkbKk0i2nSjS_L51m7q5XJT7muyeHyq9AYAmM5rz3I%7C1778041368%7Cff92dd472fe0f3f55f9a66f2cf188ca3ba7118042fee88d1b08255f6a2effa69",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1809577376.930242,
      "httpOnly": true,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "passport_csrf_token",
      "value": "b51b888bd168593833e6b0c3408820db",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1783225295.716838,
      "httpOnly": false,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "csrf_session_id",
      "value": "9ac1e5b8599e8387a1793925bea1bb9e",
      "domain": "creator.douyin.com",
      "path": "/",
      "expires": 0,
      "httpOnly": false,
      "secure": true,
      "sameSite": "None"
    },
    {
      "name": "d_ticket",
      "value": "230653f064bcedc38554b38bd789e75fd95c7",
      "domain": ".douyin.com",
      "path": "/",
      "expires": 1809577368.866497,
      "httpOnly": true,
      "secure": false,
      "sameSite": "None"
    },
    {
      "name": "x-web-secsdk-uid",
      "value": "4da56938-568e-47f7-99e1-e0e23605d345",
      "domain": "creator.douyin.com",
      "path": "/",
      "expires": 0,
      "httpOnly": false,
      "secure": false,
      "sameSite": "None"
    }
  ];

  let browser, context, page;

  try {
    console.log(`${currentTime} - 开始检查发布表单`);
    
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: true
    });
    
    await context.addCookies(cookies);
    
    page = await context.newPage();

    const response = await page.goto(targetUrl, {
      timeout: 60000,
      waitUntil: 'networkidle'
    });

    console.log(`${currentTime} - 访问成功，状态码: ${response?.status() || '无响应'}`);

    await page.waitForTimeout(5000);

    // 检查页面中的所有表单
    const forms = await page.$$('form');
    console.log(`${currentTime} - 找到 ${forms.length} 个表单`);
    
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const formHtml = await form.innerHTML();
      
      console.log(`${currentTime} - 表单 ${i} 包含的元素:`);
      
      // 检查表单中的输入字段
      const inputs = await form.$$('input, textarea, select');
      console.log(`${currentTime} -   - 输入字段: ${inputs.length} 个`);
      
      // 检查是否有必填字段
      const requiredFields = await form.$$('input[required], textarea[required], select[required]');
      console.log(`${currentTime} -   - 必填字段: ${requiredFields.length} 个`);
      
      // 检查是否有任何与标题或描述相关的字段
      const titleFields = await form.$$('input[placeholder*="标题"], input[name*="title"], textarea[placeholder*="标题"], textarea[name*="title"]');
      const descFields = await form.$$('textarea[placeholder*="描述"], textarea[name*="description"], input[placeholder*="描述"], input[name*="description"]');
      
      console.log(`${currentTime} -   - 标题字段: ${titleFields.length} 个`);
      console.log(`${currentTime} -   - 描述字段: ${descFields.length} 个`);
      
      // 检查是否有任何与标签或分类相关的字段
      const tagFields = await form.$$('input[placeholder*="标签"], input[name*="tag"], select[placeholder*="标签"], select[name*="category"]');
      console.log(`${currentTime} -   - 标签/分类字段: ${tagFields.length} 个`);
      
      // 检查是否有提交按钮
      const submitButtons = await form.$$('button[type="submit"], input[type="submit"]');
      console.log(`${currentTime} -   - 提交按钮: ${submitButtons.length} 个`);
      
      if (submitButtons.length > 0) {
        for (let j = 0; j < submitButtons.length; j++) {
          const buttonText = await submitButtons[j].textContent();
          console.log(`${currentTime} -     - 按钮 ${j} 文本: "${buttonText.trim()}"`);
        }
      }
    }

    // 检查是否有任何与发布相关的iframe
    const iframes = await page.$$('iframe');
    console.log(`${currentTime} - 找到 ${iframes.length} 个iframe`);
    
    for (let i = 0; i < iframes.length; i++) {
      const iframeUrl = await iframes[i].evaluate(el => el.src);
      console.log(`${currentTime} - iframe ${i} URL: ${iframeUrl}`);
    }

    // 检查页面中是否有任何与发布过程相关的提示信息
    const pageText = await page.textContent('body');
    console.log(`${currentTime} - 页面中包含的关键词:`);
    console.log(`${currentTime} -   - 发布成功: ${pageText.includes('发布成功') ? '是' : '否'}`);
    console.log(`${currentTime} -   - 待审核: ${pageText.includes('待审核') ? '是' : '否'}`);
    console.log(`${currentTime} -   - 错误: ${pageText.includes('错误') || pageText.includes('失败') ? '是' : '否'}`);
    console.log(`${currentTime} -   - 必填: ${pageText.includes('必填') || pageText.includes('请输入') ? '是' : '否'}`);

    // 尝试上传图片
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      const imagePath = '/home/node/.openclaw/workspace/playwright-example.png';
      if (fs.existsSync(imagePath)) {
        console.log(`${currentTime} - 找到文件输入框，上传示例图片`);
        await fileInput.setInputFiles(imagePath);
        await page.waitForTimeout(5000);
      }
    }

    const screenshot = `check-form-${currentTime.replace(/[:.]/g, '-')}.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log(`${currentTime} - 页面截图已保存: ${screenshot}`);

    // 检查发布按钮状态
    const publishBtn = await page.$('button:has-text("高清发布")');
    if (publishBtn) {
      const isDisabled = await publishBtn.evaluate(el => el.disabled);
      const ariaDisabled = await publishBtn.evaluate(el => el.getAttribute('aria-disabled'));
      const buttonText = await publishBtn.textContent();
      
      console.log(`${currentTime} - 发布按钮状态:`);
      console.log(`${currentTime} -   - 文本: "${buttonText.trim()}"`);
      console.log(`${currentTime} -   - 禁用: ${isDisabled}`);
      console.log(`${currentTime} -   - aria-disabled: ${ariaDisabled}`);
      
      // 检查按钮是否有点击事件监听器
      const buttonClickEvents = await page.evaluate((btn) => {
        const eventListeners = [];
        const proto = btn.__proto__;
        
        // 简单的方法，检查是否有onclick属性
        if (btn.hasAttribute('onclick')) {
          eventListeners.push('onclick=' + btn.getAttribute('onclick'));
        }
        
        // 检查是否有data-*属性
        for (let attr of btn.attributes) {
          if (attr.name.startsWith('data-')) {
            eventListeners.push(attr.name + '=' + attr.value);
          }
        }
        
        return eventListeners;
      }, publishBtn);
      
      console.log(`${currentTime} -   - 点击事件监听器:`, buttonClickEvents);
    }

    await browser.close();
    console.log(`${currentTime} - 检查完成`);

  } catch (error) {
    console.error(`${currentTime} - 任务失败: ${error.message}`);
    if (page) {
      const errorScreenshot = `check-form-error-${currentTime.replace(/[:.]/g, '-')}.png`;
      try {
        await page.screenshot({ path: errorScreenshot, fullPage: true });
        console.log(`${currentTime} - 错误截图已保存: ${errorScreenshot}`);
      } catch (screenshotError) {
        console.error(`${currentTime} - 截图保存失败: ${screenshotError.message}`);
      }
    }
    if (browser) {
      await browser.close();
    }
  }
}

checkPublishForm().catch(error => console.error('检查发布表单失败:', error));
