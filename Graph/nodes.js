import { END } from "@langchain/langgraph";
import { supervisorAgent } from "../Agents/supervisorAgent.js";
import { sqlAgent } from "../Agents/SQLAgent.js";
import { webAgent } from "../Agents/webAgent.js";
import { analysisAgent } from "../Agents/analysisAgent.js";
import { visualizationAgent } from "../Agents/visualizingAgent.js";
import { reportAgent } from "../Agents/reportAgent.js";


// Supervisor Node
// export async function supervisorNode(state) {

//     try {

//         export async function supervisorNode(state) {

//     const result = await supervisorAgent(state);

//     console.log("========== SUPERVISOR ==========");
//     console.log(result);

//     return {
//         supervisorDecision: result,
//         nextAgent: result.nextAgent,
//         finalResponse: result.finalResponse ?? null
//     };
// }

//     } catch(error){

//         return {
//             error: error.message,
//             success:false
//         };
//     }
// }

function classifyQuery(query = "") {
    const text = query.toLowerCase();

    const internalKeywords = /\b(total|sum|average|count|revenue|profit|sales|margin|volume|inventory|customer|unit|order|record|database|table|month|year|quarter|forecast|analysis|performance)\b/i;
    const externalKeywords = /\b(current|latest|today|now|recent|price|prices|rate|rates|trend|trends|news|weather|government|policy|regulation|diesel|petrol|gasoline|fuel|crude|oil price|exchange|stock price)\b/i;
    const reportKeywords = /\b(report|pdf|document|export|download)\b/i;
    const visualizationKeywords = /\b(chart|graph|visual|visualize|plot|dashboard)\b/i;

    if (reportKeywords.test(text)) {
        return "REPORT";
    }

    if (visualizationKeywords.test(text)) {
        return "VISUALIZATION";
    }

    if (externalKeywords.test(text)) {
        return "EXTERNAL";
    }

    if (internalKeywords.test(text)) {
        return "INTERNAL";
    }

    return "UNKNOWN";
}

export async function supervisorNode(state) {

    const queryType = classifyQuery(state?.userQuery ?? "");
    const hasSql = Boolean(state?.sqlResult);
    const hasWeb = Boolean(state?.webResult);
    const hasAnalysis = Boolean(state?.analysisResult);
    const hasVisualization = Boolean(state?.visualizationResult);
    const hasReport = Boolean(state?.reportResult);

    if (queryType === "EXTERNAL" && !hasWeb) {
        return {
            supervisorDecision: {
                nextAgent: "WEB",
                reason: "The question requires current external information.",
                agentInput: {},
                finalResponse: null
            },
            nextAgent: "WEB",
            finalResponse: null
        };
    }

    if (queryType === "INTERNAL" && !hasSql) {
        return {
            supervisorDecision: {
                nextAgent: "SQL",
                reason: "The question requires internal business data from the database.",
                agentInput: {},
                finalResponse: null
            },
            nextAgent: "SQL",
            finalResponse: null
        };
    }

    if (!hasSql) {
        return {
            supervisorDecision: {
                nextAgent: "SQL",
                reason: "No internal data is available yet and SQL is the default source for business metrics.",
                agentInput: {},
                finalResponse: null
            },
            nextAgent: "SQL",
            finalResponse: null
        };
    }

    if (!hasWeb && queryType === "EXTERNAL") {
        return {
            supervisorDecision: {
                nextAgent: "WEB",
                reason: "External data is needed and can now be retrieved from the web.",
                agentInput: {},
                finalResponse: null
            },
            nextAgent: "WEB",
            finalResponse: null
        };
    }

    if (!hasAnalysis) {
        return {
            supervisorDecision: {
                nextAgent: "ANALYSIS",
                reason: "Available data should be analyzed before forming a final response.",
                agentInput: {},
                finalResponse: null
            },
            nextAgent: "ANALYSIS",
            finalResponse: null
        };
    }

    if (queryType === "VISUALIZATION" && !hasVisualization) {
        return {
            supervisorDecision: {
                nextAgent: "VISUALIZATION",
                reason: "The user requested visualization output.",
                agentInput: {},
                finalResponse: null
            },
            nextAgent: "VISUALIZATION",
            finalResponse: null
        };
    }

    if (queryType === "REPORT" && !hasReport) {
        return {
            supervisorDecision: {
                nextAgent: "REPORT",
                reason: "The user explicitly requested a report.",
                agentInput: {},
                finalResponse: null
            },
            nextAgent: "REPORT",
            finalResponse: null
        };
    }

    return {
        supervisorDecision: {
            nextAgent: "END",
            reason: "The workflow has enough data to conclude.",
            agentInput: {},
            finalResponse: null
        },
        nextAgent: "END",
        finalResponse: null
    };
}


// SQL Node
export async function sqlNode(state) {

    try {
        console.log("=== SQL NODE INVOKED ===");
        console.log("SQL node state:", state);

        const result = await sqlAgent(state);

        console.log("=== SQL NODE RESULT ===");
        console.log(result);

        return {
            sqlResult: result.sqlResult,
            success:true
        };

    } catch(error){

        return {
            error:error.message,
            success:false
        };
    }
}



// Web Node
export async function webNode(state) {

    try {

        const result = await webAgent(state);

        return {
            webResult: result.webResult,
            success:true
        };

    } catch(error){

        return {
            error:error.message,
            success:false
        };
    }
}



// Analysis Node
export async function analysisNode(state) {

    try {

        const result = await analysisAgent(state);

        return {
            analysisResult: result.analysisResult,
            success:true
        };

    } catch(error){

        return {
            error:error.message,
            success:false
        };
    }
}



// Visualization Node
export async function visualizationNode(state) {

    try {

        const result = await visualizationAgent(state);

        return {
            visualizationResult:
                result.visualizationResult,

            success:true
        };

    } catch(error){

        return {
            error:error.message,
            success:false
        };
    }
}



// Report Node
export async function reportNode(state) {

    try {

        const result = await reportAgent(state);

        return {
            reportResult:
                result.reportResult,

            success:true
        };

    } catch(error){

        return {
            error:error.message,
            success:false
        };
    }
}