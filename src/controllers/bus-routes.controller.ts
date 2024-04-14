import { Elysia, t } from "elysia";
import { databaseMiddleware } from "../middlewares";
import { BusRoutesService } from "../services";

export const busRoutesController = new Elysia({ prefix: "/bus-routes" }).use(
  databaseMiddleware.derive(({ db }) => {
    return {
      BusLinesService: new BusRoutesService(db),
    };
  })
);
