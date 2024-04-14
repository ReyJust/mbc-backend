import init_database from "../db";
import { Elysia } from "elysia";

export const databaseMiddleware = new Elysia({ name: "db" }).decorate(
  "db",
  await init_database()
);
