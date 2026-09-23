import OpenAI from "openai";
import dotenv from "dotenv";
import { SupervisorSchema } from "../Schemas/supervisorSchema.js";
import { SUPERVISOR_SYSTEM_PROMPT } from "../prompts/supervisorPrompt.js";

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

export async function supervisorAgent(state) {
    try {
        const response = await client.chat.completions.create({
            model: "openai/gpt-oss-120b",
            temperature: 0.1,
            response_format: {
                type: "json_object"
            },
            messages: [
                {
                    role: "system",
                    content: SUPERVISOR_SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        question: state.question,
                        sqlResult: state.sqlResult ?? null,
                        webResult: state.webResult ?? null,
                        analysis: state.analysis ?? null,
                        visualization: state.visualization ?? null,
                        report: state.report ?? null
                    })
                }
            ]
        });

        const raw = response.choices[0].message.content;

        console.log("Supervisor Raw Response:", raw);

        const parsed = JSON.parse(raw);

        return SupervisorSchema.parse(parsed);

    } catch (err) {
        console.error("Supervisor Agent Error:", err);
        throw err;
    }
}