import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function run() {
  const res = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "user", content: "Say hello Shan " }
    ],
  });

  console.log(res.choices[0].message.content);
}

run();