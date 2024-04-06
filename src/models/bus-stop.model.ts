import { Elysia, t } from "elysia";

export const busStopDTO = new Elysia().model({
  busStop: t.Object({
    latitude: t.Numeric(),
    longitude: t.Numeric(),
    name: t.String(),
  }),
  busStopLog: t.Object({
    log_dt: t.Date(),
    direction: t.Number(),
  }),
});
