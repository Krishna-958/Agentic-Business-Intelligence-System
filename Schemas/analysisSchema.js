import { z } from "zod";

export const AnalysisSchema = z.object({
    summary: z.string(),

    insights: z.array(
        z.object({
            title: z.string(),
            description: z.string()
        })
    ),

    trends: z.array(
        z.object({
            title: z.string(),
            description: z.string()
        })
    ).default([]),

    anomalies: z.array(
        z.object({
            title: z.string(),
            description: z.string()
        })
    ).default([]),

    risks: z.array(
        z.object({
            title: z.string(),
            description: z.string()
        })
    ).default([]),

    opportunities: z.array(
        z.object({
            title: z.string(),
            description: z.string()
        })
    ).default([]),

    recommendations: z.array(
        z.object({
            title: z.string(),
            description: z.string(),
            priority: z.enum(["high", "medium", "low"])
        })
    ).default([]),

    visualizations: z.array(
        z.object({
            chart_type: z.enum([
                "line",
                "bar",
                "pie",
                "doughnut",
                "scatter"
            ]),
            title: z.string(),
            reason: z.string()
        })
    ).default([])
});