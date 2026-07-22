// import OpenAI from "openai";

// const client = new OpenAI({
//     apiKey: process.env.NVIDIA_API_KEY,
//      baseURL: "https://integrate.api.nvidia.com/v1"
// });

// const messages = [
//     {
//         role: 'system',
//         content: `You are the Analysis Agent in an Agentic Business Intelligence (ABI) system.

// Your role is to analyze structured business data received from other agents.

// Responsibilities:
// - Analyze SQL and/or web data.
// - Identify trends, anomalies, risks, and opportunities.
// - Explain possible causes using only the provided data.
// - Generate business recommendations.
// - Suggest appropriate visualizations.

// Rules:
// - Do NOT access databases.
// - Do NOT search the web.
// - Do NOT use external knowledge.
// - Do NOT invent facts or assumptions.
// - If evidence is insufficient, clearly state it.
// - Base every conclusion on the provided data.
// - Return ONLY valid JSON.

// Output Schema:

// {
//   "summary": "",
//   "insights": [],
//   "trends": [],
//   "anomalies": [],
//   "risks": [],
//   "opportunities": [],
//   "recommendations": [],
//   "visualizations": []
// }`
//     },
//     {
//         role: 'user',
//         content: `{
//   "user_question": "Should I increase petrol prices next week?",
//   "sql_data": {
//     "sales_trend": "Increasing",
//     "profit_margin": 14.5,
//     "inventory": 8200,
//     "customer_count": "Increasing"
//   },
//   "web_data": {
//     "crude_oil_price": "Expected to rise by 8%",
//     "government_tax": "No changes",
//     "festival": "Raksha Bandhan next week"
//   }
// }`
//     }
// ];

// const response = await client.chat.completions.create({
//     model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
//     messages: messages,
//     temperature: 0.2,
//     max_tokens: 4096,
//     seed: 42,
//     response_format: {
//         type: 'json_object'
//     }
// });

// try{
//     const result = JSON.parse(response.choices[0].message.content);
// console.log(result);
// } catch(err){
//     console.error("Invalid JSON returned by the analysis agent");
//     console.error(err);

// console.log(response.choices[0].message.content);
// }

import OpenAI from "openai";
import { ANALYSIS_SYSTEM_PROMPT } from "../prompts/analysisPrompt.js";
import { AnalysisSchema } from "../Schemas/analysisSchema.js";

const client = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1"
});

export async function analysisAgent(state) {
    try {

        const userQuestion = state.userQuery;
        const sqlData = state.sqlResult;
        const webData = state.webResult;

        const messages = [
            {
                role: "system",
                content: ANALYSIS_SYSTEM_PROMPT
            },
            {
                role: "user",
                content: JSON.stringify({
                    user_question: userQuestion,
                    sql_data: sqlData,
                    web_data: webData
                })
            }
        ];


        const response = await client.chat.completions.create({

            model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",

            messages,

            temperature: 0.2,

            max_tokens: 4096,

            seed: 42,

            response_format: {
                type: "json_object"
            }
        });

        const analysis = AnalysisSchema.parse(
            JSON.parse(response.choices[0].message.content)
        );

        return {
            success: true,
            analysisResult: analysis
        };

    } catch (err) {
        throw new Error(`Analysis Agent failed: ${err.message}`);
    }
}

const result = await analysisAgent({
    userQuery: "Should I increase petrol prices next week?",

    sqlResult: {
        sales_trend: "Increasing",
        profit_margin: 14.5
    },

    webResult: {
        summary: "Crude oil prices may increase"
    },

    visualizationResult: null,
    reportResult: null
});

console.log(JSON.stringify(result, null, 2));