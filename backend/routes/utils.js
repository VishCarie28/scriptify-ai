require("dotenv").config();
const OpenAI = require("openai");

// ✅ Proper initialization for OpenAI Node SDK v4
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to query GPT-4 with a prompt
async function askGPT(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("🔥 GPT Query Failed:", error.message);
    throw error;
  }
}

module.exports = { askGPT };
