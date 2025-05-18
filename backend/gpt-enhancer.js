require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function askGPT(rawScript) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `You are an expert Playwright Test engineer. Transform the given raw Playwright script into a clean, modular test suite using best practices.

✅ **Guidelines:**

1. Use Playwright Test Runner: import { test, expect } from '@playwright/test'
2. Wrap related tests inside test.describe() with meaningful titles.
3. Each test() should:
   - Be self-contained
   - Have a descriptive title
   - Include clear comments for each logical step
4. Setup repeated actions using test.beforeEach()
5. Prefer locator strategies in this order:
   - getByRole()
   - getByLabel()
   - page.locator()
   - getByText()
   - CSS selectors (last resort)
6. Navigation:
   - Use page.goto(url, { waitUntil: 'networkidle' })
   - Use page.waitForEvent('popup') or context.waitForEvent('page') for new tabs
7. Assertions:
   - Always assert key outcomes using expect
   - Use expect(locator).toBeVisible() or similar
8. Do not wrap expect() in await
9. Avoid waitForTimeout() or hard-coded waits
10. Inline single-use locators unless reused
11. Do not click error messages; just assert them

🔄 Output raw JavaScript. No Markdown. No explanations.`
        },
        {
          role: "user",
          content: `Convert the following Playwright script into structured test cases:\n\n${rawScript}`
        }
      ]
    });

    const enhancedScript = response.choices[0].message.content.trim();
    return postProcessScript(enhancedScript);
  } catch (error) {
    console.error("🔥 GPT Query Failed:", error.message);
    throw error;
  }
}

function postProcessScript(script) {
  const gotoMatch = script.match(/await\s+page\.goto\(['"](.*?)['"]/);
  const baseUrl = gotoMatch?.[1];

  if (baseUrl) {
    script = script.replace(
      new RegExp(`\\s*await\\s+page\\.goto\\(['"]${baseUrl}['"](,\\s*\\{[^}]*\\})?\\);?`, "g"),
      ""
    );

    const describeBlock = /test\.describe\((['"`].*?['"`]),\s*\(\)\s*=>\s*\{/;
    if (describeBlock.test(script)) {
      script = script.replace(describeBlock, (match) => {
        return `${match}\n  test.beforeEach(async ({ page }) => {\n    await page.goto('${baseUrl}', { waitUntil: 'networkidle' });\n  });`;
      });
    } else {
      script = script.replace(
        /test\((['"`].*?['"`]),\s*async\s*\(\{\s*page[^}]*\}\)\s*=>\s*\{/g,
        (match, name) => `test(${name}, async ({ page, context }) => {\n  await page.goto('${baseUrl}', { waitUntil: 'networkidle' });`
      );
    }
  }

  // Fix improper usage: expect(await ...) → expect(...)
  script = script.replace(/expect\s*\(\s*await\s+(.*?)\)/g, 'expect($1)');

  // Convert `.isVisible().toBe(true)` to `await expect(locator).toBeVisible()`
  script = script.replace(
    /expect\(\s*(.+?)\.isVisible\(\)\s*\)\.toBe\(true\);/g,
    'await expect($1).toBeVisible();'
  );

  // Convert `.isVisible().not.toBe(true)` to `await expect(locator).not.toBeVisible()`
  script = script.replace(
    /expect\(\s*(.+?)\.isVisible\(\)\s*\)\.not\.toBe\(true\);/g,
    'await expect($1).not.toBeVisible();'
  );

  // Remove .click() if it's immediately followed by fill/check
  script = script.replace(
    /\.click\(\);\s*(?=(await\s+)?\w+\.(fill|check)\()/g,
    ''
  );

  // Remove empty beforeEach blocks
  script = script.replace(/test\.beforeEach\([^)]*\)\s*=>\s*\{\s*\}\);?/g, "");

  return script.trim();
}

module.exports = { askGPT };
