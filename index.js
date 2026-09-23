import "dotenv/config";

import {
    supervisorNode,
    sqlNode,
    webNode,
    analysisNode,
    visualizationNode,
    reportNode
} from "./Graph/nodes.js";

function isDirectDataQuestion(query = "") {
    const text = query.toLowerCase();
    return (
        /\b(what|how much|how many|total|sum|average|count|show|find|list|give me)\b/.test(text) &&
        !/\b(report|pdf|document|chart|graph|visual|visualize|plot|dashboard|recommend|should|increase|decrease|analyze|decision|strategy|advice)\b/.test(text)
    );
}

function formatCurrency(value) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
        return `$${numericValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
    return value;
}

function compactText(text, maxLength = 220) {
    if (typeof text !== "string") {
        return text;
    }

    const normalized = text.replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatOutputMessage(result) {
    if (result.finalResponse) {
        return compactText(result.finalResponse);
    }

    if (result.reportResult?.pdf) {
        return `Report generated: ${result.reportResult.pdf}`;
    }

    if (result.visualizationResult?.charts?.length) {
        return `Charts generated: ${result.visualizationResult.charts.length}`;
    }

    return "Workflow completed without a final response.";
}

function buildFinalResponse(state) {
    if (state.finalResponse) {
        return state.finalResponse;
    }

    if (state.reportResult?.markdown) {
        return state.reportResult.pdf
            ? `Report generated successfully. PDF: ${state.reportResult.pdf}`
            : "Report generated successfully.";
    }

    if (state.analysisResult?.summary) {
        return compactText(state.analysisResult.summary);
    }

    if (Array.isArray(state.sqlResult) && state.sqlResult.length > 0) {
        const row = state.sqlResult[0];
        const keys = Object.keys(row || {});

        if (keys.includes("total_revenue") || keys.includes("revenue")) {
            const value = row.total_revenue ?? row.revenue;
            if (value === null || value === undefined || value === "") {
                return "I could not find any revenue data for that period in the database.";
            }
            return `The requested revenue value is ${formatCurrency(value)}.`;
        }

        if (keys.includes("total_sales_volume") || keys.includes("sales_volume")) {
            const value = row.total_sales_volume ?? row.sales_volume;
            if (value === null || value === undefined || value === "") {
                return "I could not find any sales data for that period in the database.";
            }
            return `The requested sales value is ${value}.`;
        }

        return `Here is the query result: ${JSON.stringify(row)}`;
    }

    if (state.webResult?.summary) {
        return compactText(state.webResult.summary);
    }

    return null;
}

export async function runWorkflow(initialState) {
    let state = { ...initialState };

    for (let step = 0; step < 10; step += 1) {
        const supervisorResult = await supervisorNode(state);
        state = {
            ...state,
            ...supervisorResult
        };

        const nextAgent = String(state.nextAgent ?? "END").toUpperCase();

        if (nextAgent === "END" || nextAgent === "__END__") {
            break;
        }

        if (nextAgent === "SQL") {
            const sqlResult = await sqlNode(state);
            state = { ...state, ...sqlResult };
        } else if (nextAgent === "WEB") {
            const webResult = await webNode(state);
            state = { ...state, ...webResult };
        } else if (nextAgent === "ANALYSIS") {
            const analysisResult = await analysisNode(state);
            state = { ...state, ...analysisResult };
        } else if (nextAgent === "VISUALIZATION") {
            const visualizationResult = await visualizationNode(state);
            state = { ...state, ...visualizationResult };
        } else if (nextAgent === "REPORT") {
            const reportResult = await reportNode(state);
            state = { ...state, ...reportResult };
        } else {
            break;
        }
    }

    if (!state.finalResponse) {
        const generated = buildFinalResponse(state);
        if (generated) {
            state = {
                ...state,
                finalResponse: generated,
                supervisorDecision: {
                    ...(state.supervisorDecision ?? {}),
                    nextAgent: "END",
                    finalResponse: generated
                }
            };
        }
    }

    return state;
}


async function main() {

    const initialState = {

        userQuery:
        "Create a Arpril Month report"

    };


    const result = await runWorkflow(initialState);


    console.log("\n========== OUTPUT ==========\n");
    console.log(formatOutputMessage(result));

}


// main().catch(console.error);