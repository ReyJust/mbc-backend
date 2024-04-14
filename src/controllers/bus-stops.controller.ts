import { Elysia, NotFoundError, t } from "elysia";
import { sessionMiddleware, databaseMiddleware } from "../middlewares";
import { busRoutes, busStops, busLines, busStopsLogs } from "../db/schema";
import { eq, and, or, asc, ilike } from "drizzle-orm";
import { busStopDTO } from "../models";

import { BusStopsService } from "../services";

export const busStopsController = new Elysia({ prefix: "/bus-stops" })
  .use(databaseMiddleware)
  .use(busStopDTO)
  .derive(({ db }) => {
    return {
      BusStopsService: new BusStopsService(db),
    };
  })
  .get(
    "/",
    async ({ BusStopsService, query: { q, offset } }) => {
      if (!offset) offset = "0";

      const busStops = await BusStopsService.getBusStops(q, offset);

      return busStops;
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
    async ({ BusStopsService, params: { bus_stop_id } }) => {
      const busStop = await BusStopsService.getBusStop(parseInt(bus_stop_id));

      const linkedBusLines = await BusStopsService.getBusStopBusLines(
        busStop.id
      );
      return {
        ...busStop,
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
    async ({ BusStopsService, params: { bus_stop_id } }) => {
      const busStop = await BusStopsService.getBusStop(parseInt(bus_stop_id));

      return await BusStopsService.getBusStopLogs(busStop.id);
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
    async ({
      BusStopsService,
      params: { bus_stop_id, route_no },
      query: { direction },
    }) => {
      const busStop = await BusStopsService.getBusStop(parseInt(bus_stop_id));

      return await BusStopsService.getBusStopLogs(
        busStop.id,
        route_no,
        direction
      );
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
    async ({ BusStopsService, query: { lat, lng } }) => {
      return await BusStopsService.getNearestBusStops({ lat, lng });
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
    async ({ BusStopsService, body }) => {
      return await BusStopsService.createBusStop(body);
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
    async ({ BusStopsService, body, params: { bus_stop_id } }) => {
      return await BusStopsService.updateBusStop(parseInt(bus_stop_id), body);
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
      BusStopsService,
      user,
      params: { bus_stop_id, route_no },
      body: { direction, log_dt },
    }) => {
      return await BusStopsService.createBusStopLog(
        parseInt(bus_stop_id),
        route_no,
        log_dt,
        direction,
        user?.id as string
      );
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
