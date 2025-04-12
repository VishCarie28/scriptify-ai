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

Your task is to convert raw Playwright scripts into clean, modular, and well-structured test cases using **Playwright Test Runner** syntax.

✅ Your response must:
- Use \`import { test, expect } from '@playwright/test'\`
- Use \`test.describe()\`, \`test()\`, and proper async blocks (NO Jest or Mocha)
- Avoid using \`describe()\`, \`it()\`, \`beforeEach()\`, or other Jest/Mocha-specific syntax
- Auto-generate meaningful test titles based on user actions (e.g., "should log in successfully", "should search and display results")
- Group logically similar steps into a single test, and separate different flows into different tests
- Add meaningful \`expect()\` assertions wherever relevant (e.g., to verify element visibility, text content, URL change, etc.)
- Ensure correct Playwright syntax: 
  - Use \`toHaveValue()\` for verifying dropdown selections instead of \`selectedOption()\`
  - Use \`toBeChecked()\` for radio buttons and checkboxes
- Add helpful comments to clarify test steps
- Make the code production-ready and readable

🚫 Do NOT wrap the code in markdown blocks or backticks like \`\`\`. Just return the plain code.
`.trim(),
        },
        {
          role: "user",
          content: `Convert the following Playwright script into structured test cases:\n\n${rawScript}`,
        },
      ],
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("🔥 GPT Query Failed:", error.message);
    throw error;
  }
}

module.exports = { askGPT };
