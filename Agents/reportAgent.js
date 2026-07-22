import "dotenv/config";
import OpenAI from "openai";
import { createPDF } from "../Tools/pdfTool.js";

// import { SYSTEM_PROMPT } from "./systemPrompt.js";
import {
    ReportInputSchema,
} from "../Schemas/schema.js";

const client = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1"
});

const SYSTEM_PROMPT = `
You are the Report Agent in an Agentic Business Intelligence (ABI) system.

Convert the provided business analysis into a professional Markdown report.

The report should contain:

# Business Intelligence Report

## Executive Summary

## Key Insights

## Recommendations

## Risks

## Suggested Visualizations
- Only include visualization URLs provided in the input.
- Never create or guess chart URLs.

## Conclusion

Rules:
- Use Markdown headings.
- Use bullet points where appropriate.
- Use tables only if they improve readability.
- Do not invent facts.
- Base every statement on the provided analysis.
- Return only the Markdown report.
-do not always generate report until specifically user said.
`;

export async function reportAgent(state) {
    try {

        const wantsReport = /\b(report|pdf|document|export|download)\b/i.test(state.userQuery ?? "");

        if (!wantsReport) {
            return {
                success: false,
                status: "SKIPPED",
                reason: "Report generation only runs when the user explicitly asks for a report or document."
            };
        }

        // 1. Check required data

        if (!state.analysisResult) {
            return {
                success: false,
                status: "NEEDS_DATA",
                missing: ["analysisResult"],
                reason: "Analysis is required before generating a report."
            };
        }

        // 2. If charts are requested, check visualization

        // const wantsCharts =
        //     /chart|graph|plot|visual/i.test(state.userQuery);

        // if (wantsCharts && !state.visualizationResult) {
        //     return {
        //         success: false,
        //         status: "NEEDS_DATA",
        //         missing: ["visualizationResult"],
        //         reason: "Charts are required for this report."
        //     };
        // }

        // Validate input from the Supervisor Agent
        const validatedInput = ReportInputSchema.parse({

            userQuery: state.userQuery,

            analysisResult: state.analysisResult,

            visualizationResult: state.visualizationResult

        });


        const response = await client.chat.completions.create({
            model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: JSON.stringify(validatedInput, null, 2) }
            ],
            temperature: 0.2,
            max_tokens: 4096,
        });

        const text = response.choices?.[0]?.message?.content ?? "";

        const report = {
            title: "Business Intelligence Report",
            markdown: text,
        };

        const pdf = await createPDF(report);

        return {
            success: true,
            reportResult: {
                title: report.title,
                markdown: report.markdown,
                pdf
            }
        };
    } catch (error) {
        throw new Error(`Report Agent failed: ${error.message}`);
    }
}

