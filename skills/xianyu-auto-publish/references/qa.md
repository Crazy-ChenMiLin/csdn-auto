# Auto Xianyu Q&A

## Q: What does this skill reproduce?

A: It reproduces cookie login to Xianyu/Goofish web, opening the publish page, uploading an image, filling description, filling price/original price, checking the publish button, clicking publish, and capturing the final item URL.

## Q: What cookie file format is expected?

A: A browser-extension exported JSON array. Each item usually contains `domain`, `name`, `value`, `path`, `secure`, `httpOnly`, `sameSite`, and `expirationDate`. Do not print `value`.

## Q: Why not import cookies into the Codex in-app browser?

A: The in-app browser is useful for page inspection, but the page execution context is read-only and cannot write `document.cookie`. It also cannot import `httpOnly` cookies. The repeatable path is Playwright `browser.newContext()` plus `context.addCookies(...)`.

## Q: How do I know login worked?

A: Opening `https://www.goofish.com/publish` shows the publish form, including Chinese labels equivalent to publish idle item, item image, item description, price, and publish. A login or QR page means the cookie is not sufficient.

## Q: How do I test without publishing?

A: Run `--mode fill`. It uploads the image, fills the fields, saves screenshot/JSON state, and closes the browser without clicking publish.

## Q: How do I really publish?

A: After the user explicitly asks to publish, run `--mode publish`. On success the page redirects to `/item?id=...` and seller controls appear.

## Q: Why is the publish button disabled?

A: The most common reproduced cause is an auto-detected web-unsupported category. In the original run, descriptions containing automation/browser/software/program terms triggered a software/service category and disabled publishing. A natural physical-item description enabled the button.

## Q: What sample content successfully published in the reproduced run?

A: A local study-material image, a natural description equivalent to "secondhand English study material, real photo, clean pages, suitable for daily review", price `1`, original price `10`, free shipping, and the account's default address.

## Q: Can the web flow save drafts?

A: The reproduced web flow did not expose a save-draft button. Leaving the publish page did not show a save-draft prompt, and reopening the publish URL did not restore content. Do not promise web draft saving.

## Q: Where are outputs written?

A: By default, into the current repo's `output/playwright/`, including `*.png` screenshots and `*.json` page states. Return the key screenshot path and item URL to the user.

## Q: What if a security or CAPTCHA challenge appears?

A: Stop and tell the user manual verification is required. Do not bypass CAPTCHA, human checks, QR confirmations, or security prompts.

## Q: Can I run this headless?

A: Prefer headed mode. In the reproduced environment, `--headless` showed a Xianyu illegal-access message asking for a normal browser, while headed mode reached the publish page with the same cookies.

## Q: How do I avoid accidental public listings?

A: Use `--mode probe` or `--mode fill` unless the user clearly asks to publish. `--mode publish` is a real public listing action.
