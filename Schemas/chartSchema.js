import { z } from "zod";

export const visualizationSchema = z.object({
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

            description: z.string().optional(),

            x_axis: z.object({
                label: z.string(),
                values: z.array(z.string())
            }),

            y_axis: z.object({
                label: z.string()
            }),

            datasets: z.array(
                z.object({
                    label: z.string(),
                    data: z.array(z.number())
                })
            )
        })
    )
});