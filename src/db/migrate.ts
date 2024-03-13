import { migrate } from "drizzle-orm/node-postgres/migrator";
import init_database, { type DrizzleDatabase } from "./index.ts";
import chalk from "chalk";

import * as dotenv from "dotenv";
dotenv.config({ path: "./.env" });

export const run_migrations = async (
  drizzleDb?: DrizzleDatabase
): Promise<void> => {
  let close = false;
  if (!drizzleDb) {
    drizzleDb = await init_database();
    close = true;
  }
  await migrate(drizzleDb.db, { migrationsFolder: "drizzle" });

  if (close) {
    await drizzleDb.client.end();
  }

  console.log(chalk.green("✅ Migrations successfully applied to database!"));
};

await run_migrations();
