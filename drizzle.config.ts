import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!("DATABASE_URL" in process.env)) {
  throw new Error("DATABASE_URL not found on .env");
}

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL undefined");
}

export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: DATABASE_URL,
  },
  strict: true,
} satisfies Config;
