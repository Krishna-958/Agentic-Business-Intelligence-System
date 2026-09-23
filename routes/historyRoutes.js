import express from "express";
import tursoClient from "../lib/tursoClient.js";

const router = express.Router();

/* =====================================
   GET HISTORY
===================================== */

router.get("/", async (req, res) => {
    try {
        const result = await tursoClient.execute(`
            SELECT *
            FROM query_history
            ORDER BY created_at DESC
            LIMIT 20
        `);

        res.json(result.rows);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


/* =====================================
   SAVE HISTORY
===================================== */

router.post("/", async (req, res) => {

    try {

        const {
            userQuery,
            finalResponse,
            executedQuery
        } = req.body;

        await tursoClient.execute({
            sql: `
                INSERT INTO query_history
                (user_query, final_response, executed_query)
                VALUES (?, ?, ?)
            `,
            args: [
                userQuery,
                finalResponse,
                executedQuery || null
            ]
        });

        res.json({
            success: true
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;