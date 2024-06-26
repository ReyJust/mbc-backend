import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.ts";
import { Client } from "pg";
import type { IDatabase } from "../types/db.ts";

export default async function init_database(): Promise<IDatabase> {
  const DATABASE_URL = process.env.DATABASE_URL;
  console.log(DATABASE_URL);

  if (!("DATABASE_URL" in process.env)) {
    throw new Error("DATABASE_URL not found on .env");
  }

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL undefined");
  }

  const client = new Client({
    connectionString: DATABASE_URL,
  });
  await client.connect();

  return { client, db: drizzle(client, { schema }) };
}
