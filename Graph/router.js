import { END } from "@langchain/langgraph";

export function getExplicitAgentIntent(state) {
    const query = (state?.userQuery ?? "").toLowerCase();

    const wantsReport = /\b(report|pdf|document|export|download)\b/.test(query);
    const wantsVisualization = /\b(chart|graph|visual|visualize|plot|dashboard)\b/.test(query);

    if (wantsReport && !wantsVisualization) {
        return "REPORT";
    }

    if (wantsVisualization) {
        return "VISUALIZATION";
    }

    return null;
}

export function router(state) {
    const nextAgent = state?.nextAgent;

    const normalized = typeof nextAgent === "string"
        ? nextAgent.trim().toLowerCase()
        : "";

    if (normalized === "sql" && Boolean(state?.sqlResult)) {
        return "END";
    }

    if (normalized === "web" && Boolean(state?.webResult)) {
        return "END";
    }

    if (normalized === "analysis" && Boolean(state?.analysisResult)) {
        return "END";
    }

    if (normalized === "visualization" && Boolean(state?.visualizationResult)) {
        return "END";
    }

    if (normalized === "report" && Boolean(state?.reportResult)) {
        return "END";
    }

    switch (normalized) {
        case "sql":
            return "sql";

        case "web":
            return "web";

        case "analysis":
            return "analysis";

        case "visualization":
            return "visualization";

        case "report":
            return "report";

        case "end":
            return "END";

        default:
            return "END";
    }
}