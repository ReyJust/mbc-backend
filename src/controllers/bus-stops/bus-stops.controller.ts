import { Elysia, NotFoundError, t } from "elysia";
import init_database from "../../db";
import { sessionMiddleware } from "../../middlewares";
import { busRoutes, busStops, busLines, busStopsLogs } from "../../db/schema";
import { eq, and, or, asc, ilike } from "drizzle-orm";
import { busStopDTO } from "../../models";

const db = new Elysia({ name: "db" }).decorate("db", await init_database());

export const busStopsController = new Elysia({ prefix: "/bus-stops" })
  .use(db)
  .use(busStopDTO)
  .get(
    "/",
    async ({ db, query: { q, offset } }) => {
      if (!offset) offset = "0";

      const allBusStops = await db.db
        .select()
        .from(busStops)
        .where(or(q ? ilike(busStops.name, `%${q}%`) : undefined))
        .offset(parseInt(offset))
        .limit(100);

      const a = allBusStops.reduce((acc, curr) => {
        acc[curr.id] = curr.name;
        return acc;
      }, {} as Record<string, string | null>);

      return a;
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        offset: t.Optional(t.String()),
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
        throw new NotFoundError(`Bus stop ${bus_stop_id} not found`);
      }

      const linkedBusLines = await db.db
        .selectDistinctOn([busRoutes.routeNo], {
          title: busLines.title,
          id: busLines.id,
        })
        .from(busRoutes)
        .innerJoin(busLines, eq(busRoutes.routeNo, busLines.id));

      return {
        ...busStopData,
        linkedBusLines: linkedBusLines.reduce((acc, line) => {
          acc[line.id] = line.title;

          return acc;
        }, {} as { [id: string]: string | null }),
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
      // ? Since we don't pass the bus stop id (serial), there is no risk to create an already existing.
      const busStop = await db.db.insert(busStops).values(body).returning();

      return busStop[0];
    },
    {
      body: t.Object({
        latitude: t.Numeric(),
        longitude: t.Numeric(),
        name: t.String(),
      }),
      response: t.Object({
        id: t.Number(),
        name: t.Nullable(t.String()),
        latitude: t.Nullable(t.Numeric()),
        longitude: t.Nullable(t.Numeric()),
        logicalId: t.Nullable(t.String()),
      }),
      detail: {
        summary: "Create a bus stop",
        tags: ["Bus Stops"],
      },
    }
  )
  .put(
    "/:bus_stop_id",
    async ({ db, body, params: { bus_stop_id } }) => {
      const busStop = await db.db
        .update(busStops)
        .set(body)
        .where(eq(busStops.id, parseInt(bus_stop_id)))
        .returning();

      if (busStop.length === 0) {
        throw new NotFoundError(`Bus Stop ${bus_stop_id} not found`);
      }

      return busStop[0];
    },
    {
      params: t.Object({
        bus_stop_id: t.String(),
      }),
      response: t.Object({
        id: t.Number(),
        name: t.Nullable(t.String()),
        latitude: t.Nullable(t.Numeric()),
        longitude: t.Nullable(t.Numeric()),
        logicalId: t.Nullable(t.String()),
      }),
      body: "busStop",
      detail: {
        summary: "Update a bus stop",
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
        busStopId: String(bus_stop_id),
        direction,
        userId: user?.id as string,
      });
    },
    {
      params: t.Object({
        bus_stop_id: t.String(),
        route_no: t.String(),
      }),
      body: "busStopLog",
      detail: {
        summary: "Add a log for a bus stop on a bus line.",
        tags: ["Bus Stops"],
      },
    }
  );
