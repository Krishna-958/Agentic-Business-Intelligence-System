import { generateChart } from "../Tools/chartTool.js";
import { visualizationSchema } from "../Schemas/chartSchema.js";

function toLabel(value) {
    return String(value)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}

function buildVisualizationPayload(state, analysisVisualization) {
    const rows = Array.isArray(state?.sqlResult) ? state.sqlResult : [];

    if (!rows.length) {
        throw new Error("No SQL data available to build a chart.");
    }

    const firstRow = rows[0];
    const rowKeys = Object.keys(firstRow ?? {});

    const xKey = rowKeys.find(key => /month|date|day|period|name|label/i.test(key)) ?? "index";

    const query = (state?.userQuery ?? "").toLowerCase();
    const preferredMetricKeys = [];

    if (query.includes("revenue")) preferredMetricKeys.push(/revenue/i);
    if (query.includes("profit")) preferredMetricKeys.push(/profit/i);
    if (query.includes("sale") || query.includes("volume")) preferredMetricKeys.push(/sales|volume/i);
    if (query.includes("price")) preferredMetricKeys.push(/price/i);

    let yKey = rowKeys.find(key => preferredMetricKeys.some(pattern => pattern.test(key)));

    if (!yKey) {
        yKey = rowKeys.find(key => typeof firstRow[key] === "number");
    }

    if (!yKey) {
        throw new Error("No numeric metric available for chart generation.");
    }

    const xValues = rows.map((row, index) => {
        const value = row[xKey];
        return value ?? String(index + 1);
    });

    const yValues = rows.map(row => Number(row[yKey]));

    return {
        chart_type: analysisVisualization?.chart_type ?? "bar",
        title: analysisVisualization?.title ?? `${toLabel(yKey)} Trend`,
        description: analysisVisualization?.reason ?? "",
        x_axis: {
            label: toLabel(xKey),
            values: xValues.map(value => String(value))
        },
        y_axis: {
            label: toLabel(yKey)
        },
        datasets: [
            {
                label: toLabel(yKey),
                data: yValues
            }
        ]
    };
}

export async function visualizationAgent(state) {
    try {

        const wantsVisualization = /\b(chart|graph|visual|visualize|plot|dashboard)\b/i.test(state.userQuery ?? "");

        if (!wantsVisualization) {
            return {
                success: false,
                status: "SKIPPED",
                reason: "Visualization generation only runs when the user explicitly asks for charts or graphs."
            };
        }

        const analysis = state.analysisResult;

        if (!analysis?.visualizations?.length) {
            return {
                success: false,
                status: "NEEDS_DATA",
                reason: "Analysis must include visualization suggestions before charts can be generated."
            };
        }

        const payload = {
            visualizations: analysis.visualizations.map(visualization => buildVisualizationPayload(state, visualization))
        };

        const parsed = visualizationSchema.parse(payload);

        const charts = [];

        for (const visualization of parsed.visualizations) {
            const result = await generateChart(visualization);
            charts.push(result);
        }

        return {
            success: true,
            visualizationResult: {
                charts,
                notes: `${charts.length} chart(s) generated successfully.`
            }
        };

    } catch (err) {
        throw new Error(`Visualization Agent failed: ${err.message}`);
    }
}

//for frontend specific
// const result = await generateChart(visualization);

// charts.push({
//     title: result.title,
//     chart_type: result.chart_type,
//     chart_url: result.chart_url
// });