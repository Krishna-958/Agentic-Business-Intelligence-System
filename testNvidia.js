import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1"
});

async function testNvidia() {
    try {
        console.log("Testing NVIDIA chat completion...");

        const response = await client.chat.completions.create({
            model: "meta/llama-3.1-8b-instruct",
            messages: [
                {
                    role: "user",
                    content: "Say hello in one short sentence."
                }
            ],
            max_tokens: 50,
            temperature: 0.6,
            top_p: 0.95,
            stream: false
        });

        console.log("\nSUCCESS!\n");
        console.log(response.choices[0].message.content);

    } catch (error) {
        console.log("\nSTATUS:", error.status);
        console.log("MESSAGE:", error.message);
        console.log("HEADERS:", error.headers);
    }
}

testNvidia();