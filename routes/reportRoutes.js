import express from "express";
import tursoClient from "../lib/tursoClient.js";
import { generateAnalyticsPdf } from "../services/pdfService.js";

const router = express.Router();

router.get("/analytics-pdf", async (req, res) => {

    try {

        const revenue = await tursoClient.execute(`
            SELECT SUM(revenue) AS totalRevenue FROM petrol_sales
        `);

        const sales = await tursoClient.execute(`
            SELECT SUM(sales_volume) AS totalSales FROM petrol_sales
        `);

        const profit = await tursoClient.execute(`
            SELECT SUM(profit) AS totalProfit FROM petrol_sales
        `);

        const revenueTrendResult = await tursoClient.execute(`
            SELECT
                strftime('%m', date) AS month,
                SUM(revenue) AS revenue
            FROM petrol_sales
            GROUP BY month
            ORDER BY month
        `);

        const citySalesResult = await tursoClient.execute(`
            SELECT
                city AS name,
                SUM(sales_volume) AS sales
            FROM petrol_sales
            GROUP BY city
            ORDER BY sales DESC
            LIMIT 5
        `);

        const data = {
            kpis: {
                totalRevenue: revenue.rows[0]?.totalRevenue || 0,
                totalSales: sales.rows[0]?.totalSales || 0,
                totalProfit: profit.rows[0]?.totalProfit || 0,
            },

            revenueTrend: revenueTrendResult.rows,
            citySales: citySalesResult.rows,
        };

        generateAnalyticsPdf(data, res);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;