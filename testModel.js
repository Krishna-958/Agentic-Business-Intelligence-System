import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1"
});

async function testModels() {
    try {
        console.log("Testing NVIDIA model access...");

        const models = await client.models.list();

        console.log("SUCCESS!");
        console.log("Number of models:", models.data.length);

        console.log("\nFirst 5 models:");

        models.data.slice(0, 5).forEach(model => {
            console.log(model.id);
        });

    } catch (error) {
        console.error("\nNVIDIA MODEL ERROR:");
        console.error(error);
    }
}

testModels();