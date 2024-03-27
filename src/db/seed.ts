import { sql } from "drizzle-orm";

import chalk from "chalk";
import inquirer from "inquirer";
import * as dotenv from "dotenv";
import init_database, { type DrizzleDatabase } from "./index.ts";

dotenv.config({ path: "./.env" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!("DATABASE_URL" in process.env)) {
  throw new Error("DATABASE_URL not found on .env");
}

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL undefined");
}

const clear = async (drizzleDb?: DrizzleDatabase): Promise<void> => {
  let close = false;

  if (!drizzleDb) {
    drizzleDb = await init_database();
    close = true;
  }

  const query = sql`SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `;

  const tables = await drizzleDb.db.execute(query);
  const table_names = tables.rows.map((row) => row.table_name);

  for (let table of table_names) {
    await drizzleDb.db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE;`));
  }

  console.log(chalk.green("✅ Successfully reset database!"));

  if (close) {
    await drizzleDb.client.end();
  }
};

const seed = async (): Promise<void> => {
  const drizzleDb = await init_database();

  try {
    // ! couldn't use this as the ordering of tables aren't preserved.
    // const TABLES: PgTable[] = Object.values(schema);
    const TABLES: string[] = [
      "bus_fares",
      "bus_lines",
      "bus_stops",
      "bus_routes",
    ];

    const prompt = await inquirer.prompt([
      {
        type: "confirm",
        name: "proceed",
        message: "🧨 Reset & 🌱 Seed Database?",
      },
    ]);

    if (!prompt.proceed) {
      console.log(chalk.red("⏮️ Cancelling"));
      return;
    }

    await clear(drizzleDb);

    for (const table_name of TABLES) {
      // const table_name = getTableName(table);
      const populate_query = sql.raw(
        `COPY ${table_name} FROM '/data/${table_name}.csv' DELIMITER ',' CSV HEADER;`
      );

      const res = await drizzleDb.db.execute(populate_query);
      /* @ts-ignore */
      console.log(populate_query.queryChunks[0].value[0]);
      console.log(res.rowCount);
    }

    console.log(chalk.green("✅ Successfully seed database!"));
  } catch (e) {
    console.log(chalk.bold.red(`❌ Failed to seed database: ${e}`));
  }
  await drizzleDb.client.end();

  return;
};
await seed();
