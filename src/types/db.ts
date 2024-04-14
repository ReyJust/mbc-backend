import * as schema from "../db/schema";
import { Client } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";

export interface IDatabase {
  client: Client;
  db: NodePgDatabase<typeof schema>;
}
