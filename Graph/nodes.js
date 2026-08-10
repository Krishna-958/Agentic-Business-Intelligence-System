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

function parseQueryIntent(query = "") {
    const text = query.toLowerCase();

    const reportKeywords = /\b(report|pdf|document|export|download)\b/i;
    const visualizationKeywords = /\b(chart|graph|visual|visualize|plot|dashboard)\b/i;
    const externalKeywords = /\b(current|latest|today|now|recent|price|prices|rate|rates|trend|trends|news|weather|government|policy|regulation|diesel|petrol|gasoline|fuel|crude|oil price|exchange|stock price)\b/i;
    const internalKeywords = /\b(total|sum|average|count|revenue|profit|sales|margin|volume|inventory|customer|unit|order|record|database|table|month|year|quarter|forecast|analysis|performance)\b/i;
    const directAnswerKeywords = /\b(what|how much|how many|total|sum|average|count|show|find|list|give me)\b/i;

    return {
        wantsReport: reportKeywords.test(text),
        wantsVisualization: visualizationKeywords.test(text),
        wantsExternal: externalKeywords.test(text),
        wantsInternal: internalKeywords.test(text),
        isDirectAnswer: directAnswerKeywords.test(text) && !reportKeywords.test(text) && !visualizationKeywords.test(text)
    };
}

function buildFallbackDecision(state) {
    const query = state?.userQuery ?? "";
    const intent = parseQueryIntent(query);
    const hasSql = Boolean(state?.sqlResult);
    const hasWeb = Boolean(state?.webResult);
    const hasAnalysis = Boolean(state?.analysisResult);
    const hasVisualization = Boolean(state?.visualizationResult);
    const hasReport = Boolean(state?.reportResult);
    const hasData = hasSql || hasWeb;

    if (intent.wantsExternal && !intent.wantsInternal && !hasWeb) {
        return { nextAgent: "WEB", reason: "The query is external and requires current web information.", finalResponse: null };
    }

    if (!hasSql && !(intent.wantsExternal && !intent.wantsInternal)) {
        return { nextAgent: "SQL", reason: "Internal business data is needed before answering.", finalResponse: null };
    }

    if (intent.wantsExternal && !hasWeb) {
        return { nextAgent: "WEB", reason: "Current external context is still needed.", finalResponse: null };
    }

    if (intent.isDirectAnswer && hasData && !intent.wantsReport && !intent.wantsVisualization) {
        return { nextAgent: "END", reason: "The answer can be produced from the available data.", finalResponse: null };
    }

    if (!hasAnalysis && hasData) {
        return { nextAgent: "ANALYSIS", reason: "The available data should be analyzed before responding.", finalResponse: null };
    }

    if (intent.wantsVisualization && !hasVisualization) {
        return { nextAgent: "VISUALIZATION", reason: "The user requested a chart or graph.", finalResponse: null };
    }

    if (intent.wantsReport && !hasReport) {
        return { nextAgent: "REPORT", reason: "The user requested a report or document.", finalResponse: null };
    }

    return { nextAgent: "END", reason: "The workflow has enough information to conclude.", finalResponse: null };
}

export async function supervisorNode(state) {
    try {
        const result = await supervisorAgent(state);
        const nextAgent = String(result?.nextAgent ?? "END").toUpperCase();

        return {
            supervisorDecision: {
                ...result,
                nextAgent,
                finalResponse: result?.finalResponse ?? null
            },
            nextAgent,
            finalResponse: result?.finalResponse ?? null
        };
    } catch (error) {
        console.warn("Supervisor LLM decision failed, using fallback routing.", error.message);
        const fallback = buildFallbackDecision(state);
        return {
            supervisorDecision: {
                nextAgent: fallback.nextAgent,
                reason: fallback.reason,
                agentInput: { userQuery: state?.userQuery ?? "" },
                finalResponse: fallback.finalResponse
            },
            nextAgent: fallback.nextAgent,
            finalResponse: fallback.finalResponse
        };
    }
}


// SQL Node
export async function sqlNode(state) {

    try {
        const result = await sqlAgent(state);

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