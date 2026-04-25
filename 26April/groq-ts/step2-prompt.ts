import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// simple template
function template(str: string, vars: any) {
  return str.replace("{feature}", vars.feature);
}

async function run() {
  const prompt = template(
    "Generate test cases for: {feature}",
    { feature: "Login for Leaf taps" }
  );

  const res = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: prompt }],
  });

  console.log(prompt);
  console.log("\nOUTPUT:\n", res.choices[0].message.content);
}

run();