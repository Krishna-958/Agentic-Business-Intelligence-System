import puppeteer from "puppeteer";
import { marked } from "marked";
import fs from "fs/promises";
import path from "path";

export async function createPDF(report) {
    const htmlBody = marked(report.markdown);

    const html = `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8"/>

<style>

body{
font-family:Inter,Segoe UI,Arial,sans-serif;
padding:40px;
color:#222;
line-height:1.7;
}

.cover{
display:flex;
flex-direction:column;
justify-content:center;
align-items:center;
height:90vh;
text-align:center;
}

.cover h1{
font-size:42px;
color:#0f62fe;
margin-bottom:10px;
}

.cover h3{
font-weight:400;
color:#555;
}

.page-break{
page-break-after:always;
}

h1{
color:#0f62fe;
border-bottom:2px solid #0f62fe;
padding-bottom:10px;
}

h2{
margin-top:35px;
color:#333;
}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

th{
background:#0f62fe;
color:white;
padding:12px;
}

td{
border:1px solid #ddd;
padding:12px;
}

pre{
background:#f4f4f4;
padding:15px;
border-radius:8px;
overflow:auto;
}

blockquote{
border-left:4px solid #0f62fe;
padding-left:15px;
color:#666;
}

</style>

</head>

<body>

<div class="cover">

<h1>Business Intelligence Report</h1>

<h3>${report.title}</h3>

<p>
Generated on
${new Date().toLocaleString()}
</p>

</div>

<div class="page-break"></div>

${htmlBody}

</body>

</html>
`;

    const browser = await puppeteer.launch({
        headless: true,
    });

    try {

        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: "networkidle0",
        });

        await page.evaluateHandle("document.fonts.ready");

        const outputDir = path.join(process.cwd(), "reports");

        await fs.mkdir(outputDir, { recursive: true });

        const filePath = path.join(
            outputDir,
            `${Date.now()}.pdf`
        );

        await page.pdf({
            path: filePath,
            format: "A4",
            printBackground: true,
            displayHeaderFooter: true,

            headerTemplate: `
        <div style="width:100%; text-align:center; font-size:10px; color:gray;">
            Business Intelligence Report
        </div>
        `,

            footerTemplate: `
        <div style="width:100%; text-align:center; font-size:10px; color:gray;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
        `,

            margin: {
                top: "60px",
                bottom: "60px",
                left: "40px",
                right: "40px",
            },
        });

        return {
            success: true,
            filePath,
            fileName: path.basename(filePath),
            createdAt: new Date().toISOString(),
        };

    } finally {

        await browser.close();

    }
}