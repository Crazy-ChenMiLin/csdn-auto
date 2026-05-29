const fs = require("fs/promises");
const path = require("path");
const { createRequire } = require("module");

function loadPlaywright() {
  try {
    return require("playwright");
  } catch (firstError) {
    try {
      return createRequire(path.join(process.cwd(), "__auto_xianyu_loader__.js"))("playwright");
    } catch {
      throw firstError;
    }
  }
}

const { chromium } = loadPlaywright();

const DEFAULT_URL = "https://www.goofish.com/publish?spm=a21ybx.home.sidebar.1.4c053da661Q9yF";

function parseArgs(argv) {
  const args = {
    mode: "probe",
    cookie: null,
    url: DEFAULT_URL,
    outputDir: path.resolve(process.cwd(), "output", "playwright"),
    headed: true,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--headless") {
      args.headed = false;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      args[key] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function normalizeSameSite(value) {
  if (!value) return undefined;
  const lower = String(value).toLowerCase();
  if (lower === "no_restriction" || lower === "none") return "None";
  if (lower === "lax") return "Lax";
  if (lower === "strict") return "Strict";
  return undefined;
}

function toPlaywrightCookie(cookie) {
  const converted = {
    name: cookie.name,
    value: cookie.value || "",
    domain: cookie.domain,
    path: cookie.path || "/",
    httpOnly: Boolean(cookie.httpOnly),
    secure: Boolean(cookie.secure),
  };
  if (cookie.expirationDate) converted.expires = Math.floor(cookie.expirationDate);
  const sameSite = normalizeSameSite(cookie.sameSite);
  if (sameSite) converted.sameSite = sameSite;
  return converted;
}

async function readCookies(cookieFile) {
  const raw = JSON.parse(await fs.readFile(cookieFile, "utf8"));
  if (!Array.isArray(raw)) throw new Error(`Cookie file must be a JSON array: ${cookieFile}`);
  return raw.filter((cookie) => cookie.domain && cookie.name).map(toPlaywrightCookie);
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function saveState(page, outputDir, label) {
  await fs.mkdir(outputDir, { recursive: true });
  const prefix = `xianyu_${stamp()}_${label}`;
  const screenshotPath = path.join(outputDir, `${prefix}.png`);
  const statePath = path.join(outputDir, `${prefix}.json`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const state = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a[href]"))
      .map((a) => ({ text: (a.innerText || a.textContent || "").trim(), href: a.href }))
      .filter((a) => a.text || /item|publish|goofish/.test(a.href))
      .slice(0, 80);
    const controls = Array.from(document.querySelectorAll("input, textarea, [contenteditable='true'], button, [role='button']"))
      .map((el, index) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          index,
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute("type"),
          role: el.getAttribute("role"),
          text: (el.innerText || el.textContent || el.value || "").trim().slice(0, 180),
          placeholder: el.getAttribute("placeholder"),
          className: String(el.className || "").slice(0, 180),
          disabled: Boolean(el.disabled) || el.getAttribute("aria-disabled") === "true" || String(el.className || "").includes("disabled"),
          visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden",
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        };
      });
    return {
      url: location.href,
      title: document.title,
      text: document.body.innerText,
      links,
      controls,
    };
  });
  await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
  return { screenshotPath, statePath, state };
}

async function openPublishPage(context, url) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(2500);
  return page;
}

async function fillForm(page, args) {
  if (!args.image) throw new Error("--image is required for fill/publish mode");
  if (!args.description) throw new Error("--description is required for fill/publish mode");
  if (!args.price) throw new Error("--price is required for fill/publish mode");

  await page.locator("input[type='file']").first().setInputFiles(args.image);
  await page.waitForTimeout(5000);

  const editor = page.locator("[contenteditable='true']").first();
  if (await editor.count()) {
    await editor.click();
    await page.keyboard.press("Control+A").catch(() => {});
    await page.keyboard.insertText(args.description);
  } else {
    await page.locator("textarea").first().fill(args.description);
  }
  await page.waitForTimeout(2000);

  const priceInputs = page.locator("input[placeholder='0.00']");
  await priceInputs.nth(0).fill(String(args.price));
  if (args.originalPrice) await priceInputs.nth(1).fill(String(args.originalPrice));
  await page.waitForTimeout(2500);
}

async function publish(page) {
  const publishButton = page.locator("button").filter({ hasText: "发布" }).first();
  const disabled = await publishButton.evaluate((button) =>
    Boolean(button.disabled) || button.getAttribute("aria-disabled") === "true" || String(button.className || "").includes("disabled")
  );
  if (disabled) return { clicked: false, reason: "publish_button_disabled" };

  await publishButton.click({ timeout: 10_000 });
  await page.waitForLoadState("domcontentloaded", { timeout: 20_000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {});
  await page.waitForTimeout(8000);
  return { clicked: true };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!["probe", "fill", "publish"].includes(args.mode)) {
    throw new Error("--mode must be one of: probe, fill, publish");
  }

  if (!args.cookie) {
    throw new Error("--cookie is required. Please provide the path to your cookie JSON file.");
  }

  const cookies = await readCookies(args.cookie);
  const browser = await chromium.launch({
    headless: !args.headed,
    slowMo: args.headed ? 80 : 0,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });
  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  await context.addCookies(cookies);

  try {
    const page = await openPublishPage(context, args.url);
    const initial = await saveState(page, args.outputDir, "initial");

    if (args.mode === "probe") {
      const loggedIn = /发闲置|宝贝图片|宝贝描述|发布/.test(initial.state.text);
      console.log(JSON.stringify({
        status: loggedIn ? "publish_page_accessible" : "publish_page_not_confirmed",
        importedCookieCount: cookies.length,
        url: initial.state.url,
        title: initial.state.title,
        screenshotPath: initial.screenshotPath,
        statePath: initial.statePath,
        textPreview: initial.state.text.slice(0, 1600),
      }, null, 2));
      return;
    }

    await fillForm(page, args);
    const filled = await saveState(page, args.outputDir, "filled");

    if (args.mode === "fill") {
      const publishControls = filled.state.controls.filter((control) => control.text.includes("发布"));
      console.log(JSON.stringify({
        status: "filled_without_submit",
        url: filled.state.url,
        title: filled.state.title,
        screenshotPath: filled.screenshotPath,
        statePath: filled.statePath,
        publishControls,
        textPreview: filled.state.text.slice(0, 1800),
      }, null, 2));
      return;
    }

    const publishResult = await publish(page);
    const final = await saveState(page, args.outputDir, "final");
    const currentItemUrl = /\/item\?/.test(final.state.url) ? final.state.url : null;
    const itemLinks = final.state.links.filter((link) => /goofish\.com\/item|\/item\?/.test(link.href));
    const successLikely = Boolean(currentItemUrl) || /发布成功|发布完成|上架成功|已发布|下架|删除/.test(final.state.text);
    const verificationLikely = /验证|扫码|安全|风险|人机|验证码/.test(final.state.text);

    console.log(JSON.stringify({
      status: successLikely ? "published_or_success_page_detected" : verificationLikely ? "verification_or_security_page_detected" : "publish_result_uncertain",
      publishResult,
      url: final.state.url,
      title: final.state.title,
      currentItemUrl,
      itemLinks: itemLinks.slice(0, 10),
      screenshotPath: final.screenshotPath,
      statePath: final.statePath,
      textPreview: final.state.text.slice(0, 2200),
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
