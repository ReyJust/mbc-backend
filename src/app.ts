import { Elysia, NotFoundError, ValidationError } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { helmet } from "elysia-helmet";
import {
  authController,
  busLinesController,
  busRoutesController,
  busStopsController,
} from "./controllers";
import init_database from "./db";
import { cors } from "@elysiajs/cors";
import chalk from "chalk";
import { logger } from "@bogeychan/elysia-logger";

// import * as middlewares from "./middlewares";

const db = new Elysia({ name: "db" }).decorate("db", await init_database());

const app = new Elysia()
  .use(
    logger({
      level: "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "MBC Backend",
          version: "1.0.0",
        },
        tags: [
          { name: "App", description: "General endpoints" },
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Bus Stops", description: "Access bus stops data" },
          { name: "Bus Lines", description: "Access bus lines data" },
          { name: "Bus Routes", description: "Access bus routes data" },
        ],
      },
    })
  )
  .onError(({ code, error, set, log }) => {
    console.log(code);
    let error_name: null | string = null;
    let message: null | string = null;

    switch (code) {
      case "NOT_FOUND":
        set.status = 404;
        error_name = "Not Found";
        message = error.message != code ? error.message : null;
        break;

      case "VALIDATION":
        if (["body", "params", "query", "request"].includes(error.type)) {
          set.status = 400;
          const validationError = error.validator.Errors(error.value).First();
          error_name = validationError.message;
          message = validationError.schema.error;
        } else {
          set.status = 500;
          message = "Internal Server Error";
          log.error(`Issue with ${error.type}: ${error}\n ${error.value}`);
        }

        break;

      default:
        if (error.name === "AlreadyExistsError") {
          set.status = 400;
          error_name = "Ressource Already exist";
          message = error.message != code ? error.message : null;
        } else {
          set.status = 500;
          message = "Internal Server Error";
          log.error(error);
        }
        break;
    }

    return {
      error: {
        name: error_name,
        message,
      },
    };
  })
  .use(cors())
  .use(helmet())
  .use(db)
  .get("/health", ({ db, log }) => {
    return "Healthy!";
  })
  .use(authController)
  .use(busLinesController)
  .use(busRoutesController)
  .use(busStopsController)
  .listen(3000);

console.log(chalk.bgGreen(" RUNNING "));
console.info(
  chalk.green(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
  )
);

// app.onStop((app) => {
//   app.
//   console.log("stopped app");
// });

// process.on("SIGINT", (code) => {
//   console.log('log')
//   app.stop();
// });

export { app, db };
export type App = typeof app;
