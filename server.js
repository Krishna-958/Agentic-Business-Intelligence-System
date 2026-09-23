import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";

import analyticsRoutes from "./routes/analyticsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";

import tursoClient from "./lib/tursoClient.js";
import { runWorkflow } from "./index.js";

const app = express();

const PORT = process.env.PORT || 5000;


/* ================================
   MIDDLEWARE
================================ */

app.use(cors());
app.use(express.json());

app.use(
    "/reports",
    express.static(path.join(process.cwd(), "reports"))
);

app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/history", historyRoutes);


/* ================================
   HEALTH CHECK
================================ */

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "ABI Backend is running"
    });
});


/* ================================
   ANALYZE
================================ */

app.post("/api/analyze", async (req, res) => {

    try {

        const { query } = req.body;

        if (!query || typeof query !== "string") {
            return res.status(400).json({
                success: false,
                error: "Query is required."
            });
        }


        const initialState = {
            userQuery: query.trim(),

            sqlResult: null,
            webResult: null,
            analysisResult: null,
            visualizationResult: null,
            reportResult: null,

            finalResponse: null,

            success: true,
            error: null
        };


        /* ================================
           RUN WORKFLOW
        ================================ */

        const result = await runWorkflow(initialState);


        /* ================================
           SAVE QUERY HISTORY
        ================================ */

        try {

            await tursoClient.execute({
                sql: `
                    INSERT INTO query_history
                    (user_query, final_response, executed_query)
                    VALUES (?, ?, ?)
                `,
                args: [
                    query.trim(),
                    result.finalResponse || "",
                    result.executedQuery || ""
                ]
            });

        } catch (historyError) {

            console.error("History Save Error:", historyError);

        }


        /* ================================
           RESPONSE
        ================================ */

        res.json({

            success: result.success !== false,

            query: query.trim(),

            finalResponse: result.finalResponse ?? null,

            supervisorDecision: result.supervisorDecision ?? null,

            sqlResult: result.sqlResult ?? null,

            webResult: result.webResult ?? null,

            analysisResult: result.analysisResult ?? null,

            visualizationResult: result.visualizationResult ?? null,

            reportResult: result.reportResult ?? null,

            error: result.error ?? null
        });

    } catch (error) {

        console.error("Analyze API Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


/* ================================
   SERVER
================================ */

app.listen(PORT, () => {
    console.log(`ABI Backend running on http://localhost:${PORT}`);
});