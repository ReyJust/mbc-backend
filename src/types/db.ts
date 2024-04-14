import * as schema from "../db/schema";
import { Client } from "pg";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";

export type DatabaseConn = NodePgDatabase<typeof schema>;

export interface IDatabase {
  client: Client;
  db: DatabaseConn;
}
