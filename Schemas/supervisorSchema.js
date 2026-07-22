// import { z } from "zod";

// export const SupervisorSchema = z.object({
//     nextAgent: z.enum([
//         "SQL",
//         "WEB",
//         "ANALYSIS",
//         "VISUALIZATION",
//         "REPORT",
//         "END"
//     ]),

//     reason: z.string().min(1),

//     finalResponse: z.string().nullable()
// });

import { z } from "zod";

export const SupervisorSchema = z.object({

    nextAgent: z.enum([
        "SQL",
        "WEB",
        "ANALYSIS",
        "VISUALIZATION",
        "REPORT",
        "END"
    ]),

    reason: z.string().min(1),

    agentInput: z
        .record(
            z.string(),
            z.any()
        )
        .default({}),

    finalResponse: z.string().nullable()

});