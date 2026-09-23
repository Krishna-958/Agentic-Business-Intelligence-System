import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

export default tursoClient;