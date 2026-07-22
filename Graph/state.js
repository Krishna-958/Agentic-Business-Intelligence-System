import { Annotation } from "@langchain/langgraph";


export const ABIState = Annotation.Root({

    // User input
    userQuery: Annotation(),


    // Supervisor decision
    supervisorDecision: Annotation(),

    nextAgent: Annotation(),


    // Agent outputs

    sqlResult: Annotation({
        reducer: (old, value) => value ?? old,
        default: () => null
    }),


    webResult: Annotation({
        reducer: (old, value) => value ?? old,
        default: () => null
    }),


    analysisResult: Annotation({
        reducer: (old, value) => value ?? old,
        default: () => null
    }),


    visualizationResult: Annotation({
        reducer: (old, value) => value ?? old,
        default: () => null
    }),


    reportResult: Annotation({
        reducer: (old, value) => value ?? old,
        default: () => null
    }),


    // Final answer
    finalResponse: Annotation(),


    // Workflow status
    success: Annotation(),

    error: Annotation(),

});