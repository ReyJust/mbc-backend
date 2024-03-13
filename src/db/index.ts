import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../schema.ts";
import { Client } from "pg";

import * as dotenv from "dotenv";

export type DrizzleDatabase = {
  client: Client;
  db: NodePgDatabase<typeof schema>;
};

export default async function init_database() {
  dotenv.config({ path: "./.env" });

  const DATABASE_URL = process.env.DATABASE_URL;

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
