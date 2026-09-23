import express from "express";
import tursoClient from "../lib/tursoClient.js";

const router = express.Router();

/* =====================================
   KPI SUMMARY
===================================== */

router.get("/kpis", async (req, res) => {
    try {
        const revenue = await tursoClient.execute(`
            SELECT SUM(revenue) AS totalRevenue
            FROM petrol_sales
        `);

        const sales = await tursoClient.execute(`
            SELECT SUM(sales_volume) AS totalSales
            FROM petrol_sales
        `);

        const profit = await tursoClient.execute(`
            SELECT SUM(profit) AS totalProfit
            FROM petrol_sales
        `);

        res.json({
            totalRevenue: Number(revenue.rows[0]?.totalRevenue || 0),
            totalSales: Number(sales.rows[0]?.totalSales || 0),
            totalProfit: Number(profit.rows[0]?.totalProfit || 0),
        });

    } catch (error) {
        console.error("KPI Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


/* =====================================
   REVENUE TREND (MONTHLY)
===================================== */

router.get("/revenue-trend", async (req, res) => {
    try {
        const result = await tursoClient.execute(`
            SELECT
                strftime('%m', date) AS month,
                SUM(revenue) AS revenue
            FROM petrol_sales
            GROUP BY month
            ORDER BY month
        `);

        const monthNames = {
            "01": "Jan",
            "02": "Feb",
            "03": "Mar",
            "04": "Apr",
            "05": "May",
            "06": "Jun",
            "07": "Jul",
            "08": "Aug",
            "09": "Sep",
            "10": "Oct",
            "11": "Nov",
            "12": "Dec"
        };

        const data = result.rows.map((row) => ({
            month: monthNames[row.month] || row.month,
            revenue: Number(row.revenue || 0)
        }));

        res.json(data);

    } catch (error) {
        console.error("Revenue Trend Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


/* =====================================
   SALES BY CITY
===================================== */

router.get("/sales-by-city", async (req, res) => {
    try {
        const result = await tursoClient.execute(`
            SELECT
                city AS name,
                SUM(sales_volume) AS sales
            FROM petrol_sales
            GROUP BY city
            ORDER BY sales DESC
            LIMIT 5
        `);

        const data = result.rows.map((row) => ({
            name: row.name,
            sales: Number(row.sales || 0)
        }));

        res.json(data);

    } catch (error) {
        console.error("Sales By City Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


/* =====================================
   PROFIT MARGIN BY CITY
===================================== */

router.get("/profit-margin-by-city", async (req, res) => {
    try {
        const result = await tursoClient.execute(`
            SELECT
                city AS name,
                ROUND(AVG(profit_margin), 2) AS margin
            FROM petrol_sales
            GROUP BY city
            ORDER BY margin DESC
            LIMIT 5
        `);

        const data = result.rows.map((row) => ({
            name: row.name,
            margin: Number(row.margin || 0)
        }));

        res.json(data);

    } catch (error) {
        console.error("Profit Margin Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


/* =====================================
   RECENT SALES
===================================== */

router.get("/recent-sales", async (req, res) => {
    try {
        const result = await tursoClient.execute(`
            SELECT
                date,
                city,
                revenue,
                profit
            FROM petrol_sales
            ORDER BY date DESC
            LIMIT 10
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Recent Sales Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;