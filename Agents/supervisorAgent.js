// import Groq from "groq-sdk";
// // import { createGroq } from "@ai-sdk/groq";
// // import { generateObject } from "ai";
// import dotenv from "dotenv";
// import { SupervisorSchema } from "../Schemas/supervisorSchema.js";
// import { SUPERVISOR_SYSTEM_PROMPT } from "../prompts/supervisorPrompt.js";

// dotenv.config();

// // const groq = createGroq({
// //     apiKey: process.env.GROQ_API_KEY,
// // });

// const groq = new Groq({
//     apiKey: process.env.GROQ_API_KEY,
// });

// export async function supervisorAgent(state) {

//     try {
//         const response = await groq.chat.completions.create({
//             model: "llama-3.3-70b-versatile",

//             temperature: 0.1,

//             response_format: {
//                 type: "json_object"
//             },

//             messages: [
//                 {
//                     role: "system",
//                     content: SUPERVISOR_SYSTEM_PROMPT
//                 },
//                 {
//                     role: "user",
//                     content: JSON.stringify(state, null, 2)
//                 }
//             ]
//         });

//        const parsed = JSON.parse(response.choices[0].message.content);

//         return SupervisorSchema.parse(parsed);
//     } catch (err) {
//         console.error(err);
//         throw err;
//     }
// }


import OpenAI from "openai";
import dotenv from "dotenv";
import { SupervisorSchema } from "../Schemas/supervisorSchema.js";
import { SUPERVISOR_SYSTEM_PROMPT } from "../prompts/supervisorPrompt.js";

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1"
});


export async function supervisorAgent(state) {

    try {

        const response = await client.chat.completions.create({

            model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",

            temperature: 0.1,

            response_format: {
                type: "json_object"
            },

            messages: [

                {
                    role:"system",
                    content:SUPERVISOR_SYSTEM_PROMPT
                },


                {
                    role:"user",
                    content:
`
You are controlling an ABI workflow.

Current Workflow State:

${JSON.stringify(state,null,2)}


Decide ONLY the next agent.

Remember:

- Do not call an agent if its result already exists.
- SQL is required only when database information is needed.
- WEB is required only when external/current information is needed.
- ANALYSIS is required after required data is collected.
- VISUALIZATION is required only when user asks for charts/graphs/visuals.
- REPORT is required only when user asks for a report/PDF.
- END when the final answer can be generated.

Return only JSON.
`
                }

            ]

        });


        const raw =
            response.choices[0].message.content;


        const parsed =
            JSON.parse(raw);


        return SupervisorSchema.parse(parsed);


    }
    catch(err){

        console.error(
            "Supervisor Agent Error:",
            err
        );

        throw err;
    }

}