import OpenAI from "openai";

import dotenv from "dotenv";
import { buildSQLSystemPrompt } from "../prompts/sqlPrompt.js";
import tursoClient from "../lib/tursoClient.js";

dotenv.config();

if (!process.env.NVIDIA_API_KEY) {
    throw new Error("Missing NVIDIA_API_KEY in environment.");
}
if (!process.env.TURSO_DATABASE_URL) {
    throw new Error("Missing TURSO_DATABASE_URL in environment.");
}
if (!process.env.TURSO_AUTH_TOKEN) {
    throw new Error("Missing TURSO_AUTH_TOKEN in environment.");
}

const nvidiaClient = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1"
});



export async function sqlAgent(state) {
    try {
        const schema = await getTursoSchema();
        const messages = [
            {
                role: 'system',
                content: buildSQLSystemPrompt(schema, new Date().toUTCString())
            },
            {
                role: 'user',
                content: state.userQuery
            }
        ];

        const tools = [
            {
                "type": "function",
                "function": {
                    "name": "getTursoSchema",
                    "description": "Returns SQL DDL describing all tables and views.",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "runReadOnlySql",
                    "description": "Executes a read-only SQL query.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "sqlQuery": {
                                "type": "string"
                            }
                        },
                        required: ["sqlQuery"]
                    }
                }
            }
        ];

        const toolResults = [];

        while (true) {

            const response = await nvidiaClient.chat.completions.create({
                model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
                messages: messages,
                tools: tools,
                tool_choice: 'auto',
                parallel_tool_calls: false
            });

            messages.push(response.choices[0].message);

            let toolCalls = response.choices[0].message.tool_calls;
            if (!toolCalls || toolCalls.length === 0) {
                toolCalls = parseInlineFunctionCall(response.choices[0].message.content);
                if (toolCalls) {
                    console.log("SQL Agent parsed inline function call from content:", toolCalls);
                }
            }

            if (!toolCalls || toolCalls.length === 0) {
                const finalContent = response.choices[0].message.content;

                if (toolResults.length > 0) {

                    const lastResult = toolResults[toolResults.length - 1];

                    return {
                        success: true,
                        sqlResult: lastResult.result,
                        executedQuery: lastResult.query
                    };
                }

                try {
                    const parsed = JSON.parse(finalContent);
                    return {
                        success: true,
                        sqlResult: parsed.sqlResult ?? parsed,
                        toolResults
                    };
                } catch (err) {
                    console.warn("SQL Agent final response is not valid JSON and no tool results are available.");
                    return {
                        success: false,
                        error: `Invalid JSON response from SQL Agent: ${err.message}`,
                        rawResponse: finalContent
                    };
                }
            }

            for (const tool of toolCalls) {
                try {
                    let result;
                    const args = JSON.parse(tool.function.arguments);

                    switch (tool.function.name) {
                        case "getTursoSchema":
                            result = await getTursoSchema();
                            break;

                        case "runReadOnlySql":
                            result = await runReadOnlySql(args.sqlQuery);
                            toolResults.push({
                                tool: tool.function.name,
                                query: args.sqlQuery,
                                result
                            });
                            break;

                        default:
                            throw new Error("unknown tool");
                    }

                    messages.push({
                        role: "tool",
                        name: tool.function.name,
                        tool_call_id: tool.id,
                        content: JSON.stringify(result)
                    });
                } catch (err) {
                    console.error(err);

                    messages.push({
                        role: "tool",
                        name: tool.function.name,
                        tool_call_id: tool.id,
                        content: JSON.stringify({
                            error: err.message
                        })
                    });
                }
            }
        }
    } catch (err) {
        throw new Error(`SQL Agent failed: ${err.message}`);
    }
}

async function getTursoSchema() {
    const result = await tursoClient.execute(`
        SELECT name, type, sql
        FROM sqlite_schema
        WHERE type IN ('table','view')
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '_litestream%';
    `);
    if (result.rows.length === 0) {
        return "Database is empty.";
    }
    const schema = result.rows
        .map(
            row =>
                `-- ${row.type.toUpperCase()}: ${row.name}\n${row.sql};`
        )
        .join("\n\n");

    // console.log("===== DATABASE SCHEMA =====");
    // console.log(schema);
    // console.log("===========================");

    return schema;
}

function parseInlineFunctionCall(content) {
    if (typeof content !== "string") {
        return null;
    }
    const match = content.match(/^<function\(([^)]+)\)>([\s\S]+?)<\/function>$/);
    if (!match) {
        return null;
    }
    const [, name, argsText] = match;
    try {
        JSON.parse(argsText);
        return [
            {
                id: `${name}-${Date.now()}`,
                type: "function",
                function: {
                    name,
                    arguments: argsText
                }
            }
        ];
    } catch {
        return null;
    }
}

async function runReadOnlySql(sqlQuery) {
    const query = sqlQuery.trim();

    // console.log("Executing SQL:", query);

    //Prevent multiple SQL Queries
    const statements = query
        .split(";")
        .filter(s => s.trim().length > 0);

    if (statements.length > 1) {
        throw new Error("Multiple SQL statements are not allowed");
    }

    //Allow only read-Only queries
    const firstWord = query.split(/\s+/)[0].toUpperCase();

    if (!["SELECT", "WITH", "EXPLAIN"].includes(firstWord)) {
        throw new Error("Only read only SQL Queries are allowed.");
    }

    const result = await tursoClient.execute(query);
    // console.log("Result:", result.rows);

    return result.rows;
}