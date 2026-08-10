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

function buildFallbackAnalysis(userQuestion = "", sqlData = null, webData = null) {
    const contextHints = [];
    if (sqlData) contextHints.push("SQL data");
    if (webData) contextHints.push("web context");

    const summary = contextHints.length > 0
        ? `Analysis could not be completed from the model response for "${userQuestion || "the request"}". The workflow will continue with available context from ${contextHints.join(" and ")}.`
        : `No sufficient business data was available to generate a detailed analysis for "${userQuestion || "the request"}".`;

    return {
        summary,
        insights: [],
        trends: [],
        anomalies: [],
        risks: [],
        opportunities: [],
        recommendations: [],
        visualizations: []
    };
}

function normalizeAnalysisResult(rawContent, fallback) {
    if (typeof rawContent !== "string") {
        return fallback;
    }

    const trimmed = rawContent.trim();
    if (!trimmed) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(trimmed);
        const safeParse = AnalysisSchema.safeParse(parsed);

        if (!safeParse.success) {
            console.warn("Analysis Agent returned invalid schema; using fallback.", safeParse.error.issues);
            return fallback;
        }

        return safeParse.data;
    } catch (error) {
        console.warn("Analysis Agent could not parse the model response; using fallback.", error.message);
        return fallback;
    }
}

export async function analysisAgent(state) {
    try {
        const userQuestion = state?.userQuery ?? "";
        const sqlData = state?.sqlResult ?? null;
        const webData = state?.webResult ?? null;
        const fallback = buildFallbackAnalysis(userQuestion, sqlData, webData);

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

        const content = response.choices?.[0]?.message?.content ?? "";
        const analysis = normalizeAnalysisResult(content, fallback);

        return {
            success: true,
            analysisResult: analysis
        };
    } catch (error) {
        const fallback = buildFallbackAnalysis(state?.userQuery ?? "", state?.sqlResult ?? null, state?.webResult ?? null);
        console.warn("Analysis Agent failed; using safe fallback.", error.message);
        return {
            success: true,
            analysisResult: fallback
        };
    }
}