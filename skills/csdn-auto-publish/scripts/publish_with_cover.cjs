const fs = require("fs/promises");
const path = require("path");
const { chromium } = require("playwright");
const { parseCookiesFromFile } = require("./csdn_helpers.cjs");

const TEXT = {
  localUpload: "\u4ece\u672c\u5730\u4e0a\u4f20",
  confirmUpload: "\u786e\u8ba4\u4e0a\u4f20",
  imageEditor: "\u56fe\u7247\u7f16\u8f91",
  addTag: "\u6dfb\u52a0\u6587\u7ae0\u6807\u7b7e",
  publish: "\u53d1\u5e03\u535a\u5ba2",
  success: "\u53d1\u5e03\u6210\u529f",
  draft: "\u4fdd\u5b58\u8349\u7a3f",
};

const outputDir = process.env.CSDN_OUTPUT_DIR || process.cwd();
const cookieFile = process.env.CSDN_COOKIE_FILE || "C:/Users/26487/Desktop/csdn.txt";
const title = process.env.CSDN_TITLE || `CSDN cover publish verification ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
const tag = process.env.CSDN_TAG || "Playwright";
const topText = (process.env.CSDN_COVER_TOP || "CSDN Automation\nCover Publish Test").replace(/\\n/g, "\n");
const mainText = (process.env.CSDN_COVER_MAIN || "Publish Cover").replace(/\\n/g, "\n");
const summary = process.env.CSDN_SUMMARY || "Verify that the new CSDN editor can publish an article with a locally generated template cover.";
const body = process.env.CSDN_BODY || [
  "This article verifies the CSDN cookie + Edge + Playwright cover publish flow.",
  "",
  "## Verification",
  "",
  "1. Open the new CSDN creation editor with cookies.",
  "2. Generate a local black/yellow cover from a fixed HTML/CSS template.",
  "3. Upload the cover from the local upload control below the editor.",
  "4. Confirm the image crop dialog before publishing.",
  "5. Add an article tag, then click publish.",
].join("\n");

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function generateCover(context, coverPath, top, main) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1200, height: 675 });
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:675px;background:#0d0d0d;font-family:"Microsoft YaHei",Arial,sans-serif}
.cover{position:relative;width:1200px;height:675px;background:#0d0d0d;overflow:hidden}
.top{position:absolute;left:80px;right:80px;top:220px;transform:translateY(-50%);text-align:center;color:white;font-size:110px;line-height:1.24;font-weight:800;white-space:pre-line;letter-spacing:0}
.main{position:absolute;left:80px;right:80px;top:500px;transform:translateY(-50%);text-align:center;color:#fff200;font-size:234px;line-height:1.05;font-weight:900;white-space:pre-line;letter-spacing:0}
</style></head><body><div class="cover"><div class="top">${escapeHtml(top)}</div><div class="main">${escapeHtml(main)}</div></div></body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: coverPath, type: "jpeg", quality: 94 });
  await page.close();
}

async function dump(page, name) {
  const data = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    text: document.body.innerText,
    images: Array.from(document.querySelectorAll("img")).map((img) => {
      const rect = img.getBoundingClientRect();
      return {
        src: img.currentSrc || img.src,
        cls: String(img.className || ""),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        },
      };
    }).filter((img) => img.rect.w > 50 && img.rect.h > 30),
  }));
  await fs.writeFile(path.join(outputDir, `${name}.json`), JSON.stringify(data, null, 2), "utf8");
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true });
  return data;
}

async function setValue(page, selector, value) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "attached", timeout: 30_000 });
  await locator.fill(value);
  await page.evaluate(([sel, val]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.value = val;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, [selector, value]);
}

async function clickTextButton(page, text) {
  const roleButton = page.getByRole("button", { name: text }).last();
  if (await roleButton.count()) {
    await roleButton.click({ force: true });
    return;
  }
  const textLocator = page.locator(`text=${text}`).last();
  if (await textLocator.count()) {
    await textLocator.click({ force: true });
    return;
  }
  await page.evaluate((buttonText) => {
    const button = Array.from(document.querySelectorAll("button")).find((el) => el.textContent && el.textContent.includes(buttonText));
    if (!button) throw new Error(`Button not found: ${buttonText}`);
    button.click();
  }, text);
}

async function addArticleTag(page, value) {
  await clickTextButton(page, TEXT.addTag);
  const input = page.locator("input[placeholder*='\u6807\u7b7e'], input[placeholder*='\u8bf7\u8f93\u5165']").last();
  await input.waitFor({ state: "visible", timeout: 10_000 });
  await input.fill(value);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500);
}

async function chooseExistingCategory(page) {
  const candidates = [
    ".el-select input",
    "input[placeholder*='\u5206\u7c7b']",
    "input[placeholder*='\u4e13\u680f']",
  ];
  for (const selector of candidates) {
    const locator = page.locator(selector).last();
    if (!(await locator.count())) continue;
    await locator.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1000);
    const option = page.locator(".el-select-dropdown__item:visible, .el-dropdown-menu__item:visible").first();
    if (await option.count()) {
      await option.click({ force: true });
      await page.waitForTimeout(1000);
      return true;
    }
  }
  return false;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const coverPath = path.join(outputDir, "csdn_publish_cover.jpg");
  const cookies = await parseCookiesFromFile(cookieFile);

  // Launch browser with anti-detection
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 980 } });
  await context.addCookies(cookies);

  // Generate cover
  await generateCover(context, coverPath, topText, mainText);

  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  await page.goto("https://mp.csdn.net/mp_blog/creation/editor", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {});
  await page.waitForTimeout(6000);

  // Fill title
  await setValue(page, "#txtTitle", title);

  // Fill body
  const bodyLocator = page.frameLocator("iframe.cke_wysiwyg_frame").locator("body").first();
  await bodyLocator.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type(body, { delay: 1 });

  // Upload cover
  await page.evaluate((uploadText) => {
    const button = Array.from(document.querySelectorAll("button")).find((el) => el.textContent && el.textContent.includes(uploadText));
    if (button) button.scrollIntoView({ block: "center", inline: "center" });
  }, TEXT.localUpload);
  await page.locator("input.el_mcm-upload__input[type='file']").setInputFiles(coverPath);
  await page.waitForTimeout(7000);
  await clickTextButton(page, TEXT.confirmUpload);
  await page.locator(".vue-image-crop-upload, .el-dialog__wrapper").filter({ hasText: TEXT.imageEditor }).first().waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Fill summary and tag
  await setValue(page, "textarea[placeholder*='\u6458\u8981']", summary);
  await addArticleTag(page, tag);
  const selectedCategory = await chooseExistingCategory(page);

  await dump(page, "csdn_publish_before_click");

  // Publish
  await clickTextButton(page, TEXT.publish);
  await page.waitForTimeout(12_000);

  const after = await dump(page, "csdn_publish_after_click");
  const result = {
    status: after.text.includes(TEXT.success) || after.url.includes("/article/details/") || after.url.includes("/creation/success/") ? "published" : "publish_clicked_uncertain",
    title,
    coverPath,
    url: page.url(),
    imageCount: after.images.length,
    hasCropDialog: after.text.includes(TEXT.imageEditor),
    hasCoverPreview: after.images.some((img) => img.rect.w >= 100 && img.rect.h >= 60),
    selectedCategory,
    textSample: after.text.slice(0, 1000),
    images: after.images.slice(0, 5),
  };

  await fs.writeFile(path.join(outputDir, "csdn_publish_result.json"), JSON.stringify(result, null, 2), "utf8");
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
