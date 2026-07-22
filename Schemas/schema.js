// // import { z } from "zod";

// // export const ReportInputSchema = z.object({
// //   question: z.string(),

// //   analysis: z.object({
// //     summary: z.string(),

// //     insights: z.array(
// //       z.object({
// //         title: z.string(),
// //         description: z.string(),
// //       })
// //     ),

// //     recommendations: z.array(
// //       z.object({
// //         title: z.string(),
// //         description: z.string(),
// //         priority: z.enum(["high", "medium", "low"]),
// //       })
// //     ),

// //     risks: z.array(
// //       z.object({
// //         title: z.string(),
// //         description: z.string(),
// //       })
// //     ),

// //     visualizations: z.array(
// //       z.object({
// //         chart: z.string(),
// //         title: z.string(),
// //         x: z.string(),
// //         y: z.union([z.string(), z.array(z.string())]),
// //         reason: z.string(),
// //       })
// //     ),
// //   }),
// // });

// // export const ReportOutputSchema = z.object({
// //   title: z.string(),
// //   markdown: z.string(),
// // });

// import { z } from "zod";

// export const ReportInputSchema = z.object({
//     userQuery: z.string(),

//     analysis: z.object({
//         summary: z.string(),

//         insights: z.array(
//             z.object({
//                 title: z.string(),
//                 description: z.string()
//             })
//         ),

//         trends: z.array(
//             z.object({
//                 title: z.string(),
//                 description: z.string()
//             })
//         ).optional(),

//         anomalies: z.array(
//             z.object({
//                 title: z.string(),
//                 description: z.string()
//             })
//         ).optional(),

//         risks: z.array(
//             z.object({
//                 title: z.string(),
//                 description: z.string()
//             })
//         ),

//         opportunities: z.array(
//             z.object({
//                 title: z.string(),
//                 description: z.string()
//             })
//         ).optional(),

//         recommendations: z.array(
//             z.object({
//                 title: z.string(),
//                 description: z.string(),
//                 priority: z.enum(["high", "medium", "low"])
//             })
//         ),

//         visualizations: z.array(
//             z.object({
//                 chart_type: z.enum([
//                     "line",
//                     "bar",
//                     "pie",
//                     "doughnut",
//                     "scatter"
//                 ]),
//                 title: z.string(),
//                 reason: z.string()
//             })
//         ).optional()
//     }),

//     charts: z.array(z.any()).default([])
// });

// export const ReportOutputSchema = z.object({
//     title: z.string(),
//     markdown: z.string()
// });

import { z } from "zod";


export const ReportInputSchema = z.object({

    userQuery:z.string(),


    analysisResult:z.object({

        summary:z.string(),


        insights:z.array(
            z.object({
                title:z.string(),
                description:z.string()
            })
        ),


        trends:z.array(
            z.object({
                title:z.string(),
                description:z.string()
            })
        ).default([]),


        anomalies:z.array(
            z.object({
                title:z.string(),
                description:z.string()
            })
        ).default([]),


        risks:z.array(
            z.object({
                title:z.string(),
                description:z.string()
            })
        ).default([]),


        opportunities:z.array(
            z.object({
                title:z.string(),
                description:z.string()
            })
        ).default([]),


        recommendations:z.array(
            z.object({
                title:z.string(),
                description:z.string(),
                priority:z.enum([
                    "high",
                    "medium",
                    "low"
                ])
            })
        ).default([])

    }),


    visualizationResult:z.object({

        charts:z.array(
            z.object({
                title:z.string(),
                chart_type:z.string(),
                chart_url:z.string()
            })
        )

    }).optional()

});



export const ReportOutputSchema = z.object({

    title:z.string(),

    markdown:z.string(),

    pdf_path:z.string().optional()

});