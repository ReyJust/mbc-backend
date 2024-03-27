import { Elysia, t } from "elysia";
import init_database from "../../db";
import { eq, or, ilike, asc, and } from "drizzle-orm";
import { busLines, busRoutes } from "../../db/schema";
import swagger from "@elysiajs/swagger";
import { sessionMiddleware } from "../../middlewares";

const db = new Elysia({ name: "db" }).decorate("db", await init_database());

export const busLinesController = new Elysia({ prefix: "/bus-lines" })
  .use(db)
  .use(swagger())
  .get(
    "/",
    async ({ db, query: { q } }) => {
      const allRoutes = await db.db
        .select()
        .from(busLines)
        .where(
          or(
            q ? ilike(busLines.routeNo, `%${q}%`) : undefined,
            q ? ilike(busLines.title, `%${q}%`) : undefined
          )
        );

      const a = allRoutes.reduce((acc, curr) => {
        acc[curr.routeNo] = curr.title;
        return acc;
      }, {} as Record<string, string | null>);

      return a;
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
      response: t.Record(t.String(), t.Nullable(t.String()), {
        description: "",
      }),
      detail: {
        summary: "Search / List bus lines",
        tags: ["Bus Lines"],
      },
    }
  )
  .get(
    "/:route_no",
    async ({ db, params: { route_no }, query: { direction } }) => {
      const busLine = await db.db.query.busLines.findFirst({
        where: eq(busLines.routeNo, route_no),
      });

      if (!busLine) {
        throw new Error(`Bus line ${route_no} not found`);
      }

      const condition = [eq(busRoutes.routeNo, route_no)];

      if (direction) {
        //Filter by direction if asked
        condition.push(eq(busRoutes.direction, direction));
      }

      const route = await db.db
        .select({
          fare_stage: busRoutes.fareStage,
          average_journey_time: busRoutes.averageJourneyTimesInMinutes,
          id: busRoutes.busStopId,
          logical_id: busRoutes.busStopLogicalId,
          type: busRoutes.type,
          direction: busRoutes.direction,
        })
        .from(busRoutes)
        .where(and(...condition))
        .orderBy(asc(busRoutes.direction), asc(busRoutes.fareStage));

      return {
        title: busLine.title,
        stops: Object.values(route),
      };
    },
    {
      params: t.Object({
        route_no: t.String(),
      }),
      query: t.Object({
        direction: t.Optional(t.Numeric()),
      }),
      response: t.Object(
        {
          title: t.Nullable(t.String()),
          stops: t.Array(
            t.Object({
              fare_stage: t.Nullable(t.Number()),
              average_journey_time: t.Nullable(t.String()),
              id: t.Nullable(t.Number()),
              logical_id: t.Nullable(t.String()),
              type: t.Nullable(t.Enum({ via: "via", break: "break" })),
              direction: t.Nullable(t.Number()), //t.Nullable(t.Enum({ 1: 1, 2: 2 })),
            })
          ),
        },
        { description: "" }
      ),
      detail: {
        summary: "Get a informations of a bus line",
        tags: ["Bus Lines"],
      },
    }
  )
  .use(sessionMiddleware)
  .post(
    "/",
    async ({ db, body: { route_no, title, stops } }) => {
      const line = await db.db.insert(busLines).values({
        routeNo: route_no,
        title,
      });

      const routeData: {
        fareStage: number;
        direction: number;
        routeNo: string;
        busStopId: number;
        type: "via" | "break";
      }[] = stops.map((stop) => ({
        fareStage: stop.fare_stage,
        averageJourneyTimesInMinutes: stop.average_journey_time,
        direction: stop.direction,
        routeNo: route_no,
        busStopId: stop.bus_stop_id,
        type: "via",
      }));

      routeData[0].type = "break";
      routeData[routeData.length - 1].type = "break";

      const route = await db.db.insert(busRoutes).values(routeData);

      return line;
    },
    {
      body: t.Object({
        route_no: t.String(),
        title: t.String(),
        stops: t.Array(
          t.Object({
            bus_stop_id: t.Number(),
            fare_stage: t.Number(),
            average_journey_time: t.Numeric(),
            direction: t.Number(),
          })
        ),
      }),
      response: t.Object({}),
      detail: {
        summary: "Add a bus line",
        tags: ["Bus Lines"],
      },
    }
  )
  .put(
    "/:route_no",
    async ({ db, params: { route_no }, body: { title } }) => {
      const line = await db.db
        .update(busLines)
        .set({
          title,
        })
        .where(eq(busRoutes.routeNo, route_no));

      // TODO: Make a route to add remove a stop
      // const routeData: {
      //   fareStage: number;
      //   averageJourneyTimesInMinutes: number;
      //   direction: number;
      //   busStopId: number;
      //   type: "via" | "break";
      // }[] = stops.map((stop) => ({
      //   id: stop.id,
      //   fareStage: stop.fare_stage,
      //   averageJourneyTimesInMinutes: stop.average_journey_time,
      //   direction: stop.direction,
      //   busStopId: stop.bus_stop_id,
      //   type: "via",
      // }));

      // routeData[0].type = "break";
      // routeData[routeData.length - 1].type = "break";

      // const route = await db.db
      //   .update(busRoutes)
      //   .set(routeData[0])
      //   .where(eq(busRoutes.routeNo, route_no));

      return line;
    },
    {
      params: t.Object({
        route_no: t.String(),
      }),
      body: t.Object({
        title: t.String(),
      }),
      response: t.Object({}),
      detail: {
        summary: "Update a bus line",
        tags: ["Bus Lines"],
      },
    }
  );
