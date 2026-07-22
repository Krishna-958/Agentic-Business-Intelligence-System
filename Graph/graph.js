// import { StateGraph, START, END } from "@langchain/langgraph";

// import { ABIState } from "./state.js";

// import {
//     supervisorNode,
//     sqlNode,
//     webNode,
//     analysisNode,
//     visualizationNode,
//     reportNode
// } from "./nodes.js";

// import { router } from "./router.js";

// // Create the graph
// const workflow = new StateGraph(ABIState);

// workflow
//     .addNode("supervisor", supervisorNode)
//     .addNode("sql", sqlNode)
//     .addNode("web", webNode)
//     .addNode("analysis", analysisNode)
//     .addNode("visualization", visualizationNode)
//     .addNode("report", reportNode);

// // Graph starts with Supervisor
// workflow.addEdge(START, "supervisor");

// // Supervisor decides the next node
// workflow.addConditionalEdges(
//     "supervisor",
//     router
// );

// // Every agent returns to Supervisor
// workflow.addEdge("sql", "supervisor");
// workflow.addEdge("web", "supervisor");
// workflow.addEdge("analysis", "supervisor");
// workflow.addEdge("visualization", "supervisor");
// workflow.addEdge("report", "supervisor");

// // Compile the graph
// export const graph = workflow.compile();

import { StateGraph, START, END } from "@langchain/langgraph";

import { ABIState } from "./state.js";

import {
    supervisorNode,
    sqlNode,
    webNode,
    analysisNode,
    visualizationNode,
    reportNode
} from "./nodes.js";

import { router } from "./router.js";


const workflow = new StateGraph(ABIState);


workflow
    .addNode("supervisor", supervisorNode)
    .addNode("sql", sqlNode)
    .addNode("web", webNode)
    .addNode("analysis", analysisNode)
    .addNode("visualization", visualizationNode)
    .addNode("report", reportNode);



workflow.addEdge(START, "supervisor");


// Supervisor routing
workflow.addConditionalEdges(
    "supervisor",
    router,
    {
        sql: "sql",
        web: "web",
        analysis: "analysis",
        visualization: "visualization",
        report: "report",
        END: END,
        [END]: END
    }
);


// Agents return to supervisor
workflow.addEdge("sql", "supervisor");
workflow.addEdge("web", "supervisor");
workflow.addEdge("analysis", "supervisor");
workflow.addEdge("visualization", "supervisor");
workflow.addEdge("report", "supervisor");


export const graph = workflow.compile({ recursionLimit: 100 });