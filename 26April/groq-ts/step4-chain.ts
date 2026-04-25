import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function template(feature: string) {
  return `Generate 3 test cases for: ${feature}`;
}

async function run() {
  const prompt = template("Login testcases for Leaf taps");

  const res = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: prompt }],
  });

  const output = res.choices[0].message.content || "";

  console.log("\nCHAIN OUTPUT:\n", output);
}

run();