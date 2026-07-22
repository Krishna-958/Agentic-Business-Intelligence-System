import fs from "fs/promises";
import crypto from "crypto";

const COLORS = [
    "#4e79a7",
    "#f28e2b",
    "#e15759",
    "#76b7b2",
    "#59a14f",
    "#edc948",
    "#b07aa1",
    "#ff9da7"
];

export async function generateChart(chart) {

    const {
        chart_type,
        title,
        x_axis,
        y_axis,
        datasets
    } = chart;

    for (const dataset of datasets) {

        if (dataset.data.length !== x_axis.values.length) {

            throw new Error(
                `${dataset.label} length does not match x-axis labels`
            );
        }
    }

    const config = {

        type: chart_type,

        data: {

            labels: x_axis.values,

            datasets: datasets.map((dataset, index) => ({

                label: dataset.label,

                data: dataset.data,

                backgroundColor:
                    chart_type === "pie" ||
                    chart_type === "doughnut"
                        ? COLORS
                        : COLORS[index % COLORS.length],

                borderColor:
                    COLORS[index % COLORS.length],

                borderWidth: 2,

                fill: false,

                tension: 0.3
            }))
        },

        options: {

            responsive: true,

            plugins: {

                title: {

                    display: true,

                    text: title
                }
            },

            scales: {

                x: {

                    title: {

                        display: true,

                        text: x_axis.label
                    }
                },

                y: {

                    title: {

                        display: true,

                        text: y_axis.label
                    }
                }
            }
        }
    };

    const url =
        `https://quickchart.io/chart?width=800&height=500&c=${
            encodeURIComponent(JSON.stringify(config))
        }`;

    const response = await fetch(url);

    if (!response.ok) {

        throw new Error("Failed to generate chart");
    }

    const buffer =
        Buffer.from(await response.arrayBuffer());

    await fs.mkdir("./charts", {
        recursive: true
    });

    const filename =
        `${crypto.randomUUID()}.png`;

    const filepath =
        `./charts/${filename}`;

    await fs.writeFile(filepath, buffer);

    await fs.mkdir("./charts-config", {
        recursive: true
    });

    await fs.writeFile(
        `./charts-config/${filename.replace(".png", ".json")}`,
        JSON.stringify(config, null, 2)
    );

    return {

        title,

        chart_type,

        local_path: filepath,

        chart_url: url
    };
}