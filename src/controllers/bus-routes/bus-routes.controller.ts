import { Elysia, t } from "elysia";
import init_database from "../../db";

const db = new Elysia({ name: "db" }).decorate("db", await init_database());

export const busRoutesController = new Elysia({ prefix: "/bus-routes" })
  .use(db)
  ;
