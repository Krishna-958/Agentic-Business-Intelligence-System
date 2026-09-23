import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

async function testGroq() {
    try {
        console.log("Testing Groq...");

        const response = await client.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                {
                    role: "user",
                    content: "Say hello in one short sentence."
                }
            ],
            temperature: 0.2,
            max_tokens: 50
        });

        console.log("\nSUCCESS!\n");
        console.log(response.choices[0].message.content);

    } catch (error) {
        console.error("\nGROQ ERROR:");
        console.error(error);
    }
}

testGroq();