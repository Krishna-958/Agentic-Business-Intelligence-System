import OpenAI from "openai";
import { tavily } from "@tavily/core";
import { WEB_SYSTEM_PROMPT } from "../prompts/webPrompt.js";
import dotenv from "dotenv";
dotenv.config();

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const client = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1"
});

export async function webAgent(state) {
    try {

        const messages = [
            {
                role: "system",
                content: `${WEB_SYSTEM_PROMPT}

Current UTC Time: ${new Date().toUTCString()}`
            }
        ];

        const tools = [
            {
                type: "function",
                function: {
                    name: "webSearch",
                    description: "Search the web for current, factual, or publicly available information that cannot be answered from existing context.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "A clear and specific search query describing the information to retrieve."
                            }
                        },
                        required: ["query"],
                        additionalProperties: false
                    }
                }
            }
        ];

        messages.push({
            role: "user",
            content: state.userQuery
        });

        while (true) {

            const response = await client.chat.completions.create({
                model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
                temperature: 0.2,
                messages,
                tools,
                tool_choice: "auto",
                parallel_tool_calls: false
            });

            messages.push(response.choices[0].message);

            const toolCalls = response.choices[0].message.tool_calls;

            if (!toolCalls || toolCalls.length === 0) {
                return {
                    success: true,
                    webResult: JSON.parse(response.choices[0].message.content)
                };
            }

            for (const tool of toolCalls) {

                const functionName = tool.function.name;

                try {

                    const functionParams = JSON.parse(tool.function.arguments);

                    switch (functionName) {

                        case "webSearch": {

                            const toolResult = await webSearch(functionParams);

                            messages.push({
                                tool_call_id: tool.id,
                                role: "tool",
                                name: functionName,
                                content: toolResult
                            });

                            break;
                        }

                        default:
                            throw new Error(`Unknown tool: ${functionName}`);
                    }

                } catch (err) {

                    messages.push({
                        tool_call_id: tool.id,
                        role: "tool",
                        name: functionName,
                        content: JSON.stringify({
                            error: err.message
                        })
                    });

                }
            }
        }

    } catch (err) {
        throw new Error(`Web Agent failed: ${err.message}`);
    }
}

async function webSearch({ query }) {
    const response = await tvly.search(query, {
        max_results: 5,
        search_depth: "advanced"
    });

    return JSON.stringify(
        response.results.map(result => ({
            title: result.title,
            url: result.url,
            content: result.content,
            score: result.score
        }))
    );
}