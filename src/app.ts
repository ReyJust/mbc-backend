import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { helmet } from "elysia-helmet";
import {
  busLinesController,
  busRoutesController,
} from "./controllers";
import init_database from "./db";
import { cors } from "@elysiajs/cors";
import chalk from "chalk";

const db = new Elysia({ name: "db" }).decorate("db", await init_database());

const app = new Elysia()
  .use(swagger())
  .use(cors())
  .use(helmet())
  .use(db)
  .get("/health", ({ db }) => {
    return "Healthy!";
  })
  .use(busLinesController)
  .use(busRoutesController)
  .listen(3000);

console.log(chalk.bgGreen(" RUNNING "));
console.info(
  chalk.green(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
  )
);

export { app, db };
// export type App = typeof app;
