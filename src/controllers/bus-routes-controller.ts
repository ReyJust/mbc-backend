import { Elysia, t } from "elysia";
import init_database from "../db";
import { eq, asc, and } from "drizzle-orm";
import { busRoutes } from "../db/schema";

const db = new Elysia({ name: "db" }).decorate("db", await init_database());

export const busRoutesController = new Elysia({ prefix: "/bus-routes" })
  .use(db)
  .get(
    "/:route_no/:direction",
    async ({ db, params }) => {
      const res = await db.db
        .select({
          fare_stage: busRoutes.fareStage,
          average_journey_time: busRoutes.averageJourneyTimesInMinutes,
          id: busRoutes.busStopId,
          logical_id: busRoutes.busStopLogicalId,
          type: busRoutes.type,
        })
        .from(busRoutes)
        .where(
          and(
            eq(busRoutes.routeNo, params.route_no),
            eq(busRoutes.direction, params.direction)
          )
        )
        .orderBy(asc(busRoutes.fareStage));

      return res;
    },
    {
      params: t.Object({
        route_no: t.String(),
        direction: t.Numeric(),
      }),
    }
  );
