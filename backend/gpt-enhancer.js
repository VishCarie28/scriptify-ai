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

Your task is to convert raw Playwright scripts into clean, modular, and well-structured test cases using Playwright's test runner.

✅ Your response must:
- Use \`import { test, expect } from '@playwright/test'\`
- Use \`describe()\` and multiple \`test()\` blocks where applicable
- Auto-generate meaningful test titles based on user actions (e.g., "should log in successfully", "should search and display results")
- Group logically similar steps into a single test, and separate different flows into different tests
- Add meaningful \`expect()\` assertions wherever relevant (e.g., to verify element visibility, text content, URL change, etc.)
- Add helpful comments to clarify test steps
- Be production-ready and readable
🚫 Do not wrap the code in markdown blocks or backticks like \`\`\` or \`\`\`javascript — just return the code as plain text.
`.trim(),
        },
        {
          role: "user",
          content: `Convert the following Playwright script into structured test cases:\n\n${rawScript}`,
        },
      ],
    });

    // Return just the plain text code (no backticks, clean format)
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("🔥 GPT Query Failed:", error.message);
    throw error;
  }
}

module.exports = { askGPT };
