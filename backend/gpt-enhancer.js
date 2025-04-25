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
          content: `
You are an expert automation test developer.

Your task is to convert raw Playwright scripts into clean, structured, and **single test case** Playwright Test Runner code using JavaScript with proper Java annotations.

✅ You must:
- Use \`import { test, expect } from '@playwright/test'\`
- Wrap in a single \`test()\` block using async/await and destructured context
- Use JavaScript-style object typing where appropriate (e.g., userData)
- Use descriptive test names (e.g., "should complete registration flow")
- Break down the flow into clearly commented sections (e.g., "// Step 1: Navigate to login")
- Format code cleanly and use best practices

📍 Locator Strategy (priority order):
1. \`getByRole('button', { name: 'Submit' })\`
2. \`getByLabel('First Name')\`
3. \`page.locator('#elementId')\`
4. \`getByText('Submit', { exact: true })\`
5. CSS selectors only if others are not viable, using parent-child structure

🧭 Navigation & Page Loads:
- Use \`page.goto(url, { waitUntil: 'networkidle' })\`
- Use \`context.waitForEvent('page')\` and \`waitForLoadState()\` for popups
- Avoid \`waitForTimeout()\`, \`setTimeout()\`, or hard-coded delays

✅ Assertions (MANDATORY):
- Add **assertions after each meaningful interaction**
- Use \`expect(locator).toBeVisible()\`, \`toHaveValue()\`, \`toContainText()\`, etc.
- Do NOT use \`await expect(...)\` or \`expect(await ...)\`

🚫 Do NOT return Markdown or backticks — only raw JavaScript code.
`.trim()
        },
        {
          role: "user",
          content: `Convert the following Playwright script into structured test cases:\n\n${rawScript}`,
        },
      ],
    });

    const enhancedScript = response.choices[0].message.content.trim();
    const processedScript = postProcessScript(enhancedScript);

    // Optional: basic assertion presence check
    if (!/expect\(/.test(processedScript)) {
      console.warn("⚠️ Warning: No assertions found in the enhanced script.");
    }

    return processedScript;
  } catch (error) {
    console.error("🔥 GPT Query Failed:", error.message);
    throw error;
  }
}

function postProcessScript(script) {
  // Extract the first page.goto(...) URL
  const gotoRegex = /await\s+page\.goto\(['"`](.*?)['"`],?\s*{?[^}]*}?\)?\s*;/;
  const match = script.match(gotoRegex);
  const baseUrl = match ? match[1] : null;

  if (baseUrl) {
    // Remove all page.goto() calls
    script = script.replace(new RegExp(`\\s*await\\s+page\\.goto\\(['"\`]${baseUrl}['"\`]\\s*(?:,\\s*\\{[^}]*\\})?\\);?\\s*`, "g"), "");

    // Inject test.beforeEach block if test.describe exists
    const describeBlock = /test\.describe\((["'`].*?["'`]),\s*\(\)\s*=>\s*{/;
    if (describeBlock.test(script)) {
      script = script.replace(describeBlock, (fullMatch, title) => {
        return `${fullMatch}
  test.beforeEach(async ({ page }) => {
    await page.goto('${baseUrl}', { waitUntil: 'networkidle' });
  });`;
      });
    } else {
      // Otherwise inject directly inside the test block
      script = script.replace(/test\(['"`](.*?)['"`],\s*async\s*\(\{\s*page.*?\}\)\s*=>\s*{/, (match, testName) => {
        return `test('${testName}', async ({ page, context }) => {
  // Step 1: Navigate to the start page
  await page.goto('${baseUrl}', { waitUntil: 'networkidle' });`;
      });
    }
  }

  // Fix: replace `expect(await ...)` with `expect(...)`
  script = script.replace(/expect\s*\(\s*await\s+(.*?)\s*\)/g, 'expect($1)');

  // Remove accidental parentheses after expect calls like: expect(locator)()
  script = script.replace(/expect\(([^)]+)\)\(\)/g, 'expect($1)');

  return script;
}

module.exports = { askGPT };
