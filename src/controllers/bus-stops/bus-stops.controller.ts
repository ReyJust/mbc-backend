import { Elysia, t } from "elysia";
import init_database from "../../db";
import { sessionMiddleware } from "../../middlewares";
import { busRoutes, busStops, busLines, busStopsLogs } from "../../db/schema";
import { eq, and, or, asc, ilike } from "drizzle-orm";

const db = new Elysia({ name: "db" }).decorate("db", await init_database());

export const busRoutesController = new Elysia({ prefix: "/bus-stops" })
  .use(db)
  .get(
    "/",
    async ({ db, query: { q } }) => {
      const allBusStops = await db.db
        .select()
        .from(busStops)
        .where(
          or(
            q ? ilike(busStops.id, `%${q}%`) : undefined,
            q ? ilike(busStops.name, `%${q}%`) : undefined
          )
        );

      const a = allBusStops.reduce((acc, curr) => {
        acc[curr.id] = curr.name;
        return acc;
      }, {} as Record<string, string | null>);

      return a;
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
      detail: {
        summary: "Search / List bus stops",
        tags: ["Bus Stops"],
      },
    }
  )
  .get(
    "/:bus_stop_id",
    async ({ db, params: { bus_stop_id } }) => {
      const busStopData = await db.db.query.busStops.findFirst({
        where: eq(busStops.id, parseInt(bus_stop_id)),
      });

      if (!busStopData) {
        throw new Error(`Bus stop ${bus_stop_id} not found`);
      }

      const linkedBusLines = await db.db
        .selectDistinctOn([busRoutes.routeNo], { title: busLines.title })
        .from(busRoutes)
        .innerJoin(busLines, eq(busRoutes.routeNo, busLines.routeNo));

      return {
        ...busStopData,
        linkedBusLines,
      };
    },
    {
      params: t.Object({
        bus_stop_id: t.String(),
      }),
      detail: {
        summary: "Get a bus stop informations",
        tags: ["Bus Stops"],
      },
    }
  )
  .get(
    "/:bus_stop_id/logs",
    async ({ db, params: { bus_stop_id } }) => {
      const busStopData = await db.db.query.busStops.findFirst({
        where: eq(busStops.id, parseInt(bus_stop_id)),
      });

      if (!busStopData) {
        throw new Error(`Bus stop ${bus_stop_id} not found`);
      }

      const logs = await db.db
        .select()
        .from(busStopsLogs)
        .where(eq(busStopsLogs.busStopId, parseInt(bus_stop_id)))
        .orderBy(asc(busStopsLogs.direction));

      return logs;
    },
    {
      params: t.Object({
        bus_stop_id: t.String(),
      }),
      detail: {
        summary: "Get a bus stop logs",
        tags: ["Bus Stops"],
      },
    }
  )
  .get(
    "/:bus_stop_id/:route_no/logs",
    async ({ db, params: { bus_stop_id, route_no }, query: { direction } }) => {
      const busStopData = await db.db.query.busStops.findFirst({
        where: eq(busStops.id, parseInt(bus_stop_id)),
      });

      if (!busStopData) {
        throw new Error(`Bus stop ${bus_stop_id} not found`);
      }
      const condition = [
        eq(busStopsLogs.busStopId, parseInt(bus_stop_id)),
        eq(busStopsLogs.routeNo, route_no),
      ];

      if (direction) {
        //Filter by direction if asked
        condition.push(eq(busStopsLogs.direction, direction));
      }

      const logs = await db.db
        .select()
        .from(busStopsLogs)
        .where(and(...condition))
        .orderBy(asc(busStopsLogs.direction));

      return logs;
    },
    {
      params: t.Object({
        bus_stop_id: t.String(),
        route_no: t.String(),
      }),
      query: t.Object({
        direction: t.Optional(t.Number()),
      }),
      detail: {
        summary: "Get a bus stop logs for a single bus line",
        tags: ["Bus Stops"],
      },
    }
  )
  .get(
    "/nearest-bus-stop",
    async ({ db, query: { lat, lng } }) => {
      // TODO: Use PostGIS to do this
      throw new Error("Not implemented");
    },
    {
      query: t.Object({
        lat: t.Numeric(),
        lng: t.Numeric(),
      }),
      detail: {
        summary: "Get a bus stop logs for a single bus line",
        tags: ["Bus Stops"],
      },
    }
  )
  .use(sessionMiddleware)
  .post(
    "/",
    async ({ db, body }) => {
      await db.db.insert(busStops).values(body);
    },
    {
      body: t.Object({
        latitude: t.Numeric(),
        longitude: t.Numeric(),
        name: t.String(),
      }),
      detail: {
        summary: "Get a bus stop logs for a single bus line",
        tags: ["Bus Stops"],
      },
    }
  )
  .put(
    "/:bus_stop_id",
    async ({ db, body, params: { bus_stop_id } }) => {
      await db.db
        .update(busStops)
        .set(body)
        .where(eq(busStops.id, parseInt(bus_stop_id)));
    },
    {
      params: t.Object({
        bus_stop_id: t.String(),
      }),
      body: t.Object({
        latitude: t.Numeric(),
        longitude: t.Numeric(),
        name: t.String(),
      }),
      detail: {
        summary: "Get a bus stop logs for a single bus line",
        tags: ["Bus Stops"],
      },
    }
  )
  .post(
    "/:bus_stop_id/:route_no/logs",
    async ({
      db,
      user,
      params: { bus_stop_id, route_no },
      body: { direction, log_dt },
    }) => {
      await db.db.insert(busStopsLogs).values({
        logDate: log_dt,
        routeNo: route_no,
        busStopId: bus_stop_id,
        direction,
        userId: user?.id as string,
      });
    },
    {
      params: t.Object({
        bus_stop_id: t.Number(),
        route_no: t.String(),
      }),
      body: t.Object({
        log_dt: t.Date(),
        direction: t.Number(),
      }),
      detail: {
        summary: "Add a log for a bus stop on a bus line.",
        tags: ["Bus Stops"],
      },
    }
  );
