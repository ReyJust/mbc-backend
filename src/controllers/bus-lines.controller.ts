import {
  Elysia,
  NotFoundError,
  t,
  ValidationError,
  type Context,
} from "elysia";
import { eq, or, ilike, asc, and } from "drizzle-orm";
import { busLines, busRoutes, busStops } from "../db/schema";
import { sessionMiddleware, databaseMiddleware } from "../middlewares";

import { BusLinesService } from "../services";

export const busLinesController = new Elysia({
  prefix: "/bus-lines",
})
  .use(databaseMiddleware)
  .derive(({ db }) => {
    return {
      BusLinesService: new BusLinesService(db),
    };
  })
  .get(
    "/",
    async ({ query: { q }, BusLinesService }) => {
      const allRoutes = await BusLinesService.getLines(q);

      return allRoutes;
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
      response: t.Record(t.String(), t.Nullable(t.String()), {
        description: "List of Bus Lines",
      }),
      detail: {
        summary: "Search / List bus lines",
        tags: ["Bus Lines"],
      },
    }
  )
  .get(
    "/:route_no",
    async ({ BusLinesService, params: { route_no }, query: { direction } }) => {
      const busLine = await BusLinesService.getLine(route_no);
      const lineRoute = await BusLinesService.getLineRoute(route_no, direction);

      return {
        title: busLine.title,
        route_no: busLine.id,
        stops: Object.values(lineRoute),
      };
    },
    {
      params: t.Object({
        route_no: t.String(),
      }),
      query: t.Object(
        {
          direction: t.Optional(
            t.Numeric({
              error: "Direction must be a number",
            })
          ),
        },
        {
          error: "Allowed query parameters: ['direction']",
        }
      ),
      response: t.Object(
        {
          title: t.Nullable(t.String()),
          route_no: t.Nullable(t.String()),
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
    async ({ BusLinesService, body: { route_no, title, stops } }) => {
      return await BusLinesService.createLine(route_no, title, stops);
    },
    {
      body: t.Object({
        route_no: t.String(),
        title: t.String(),
        stops: t.Object({
          inward: t.Array(
            t.Object({
              bus_stop_id: t.Number(),
              fare_stage: t.Number({ maximum: 50 }),
              average_journey_time: t.Numeric(),
              direction: t.Number({ minimum: 1, maximum: 2 }),
              type: t.Enum({ via: "via", break: "break" }),
            }),
            {
              minItems: 2,
            }
          ),
          outward: t.Array(
            t.Object({
              bus_stop_id: t.Number(),
              fare_stage: t.Number({ maximum: 50 }),
              average_journey_time: t.Numeric(),
              direction: t.Number({ minimum: 1, maximum: 2 }),
              type: t.Enum({ via: "via", break: "break" }),
            }),
            {
              minItems: 2,
            }
          ),
        }),
      }),
      // response: t.Object({}),
      detail: {
        summary: "Add a bus line",
        tags: ["Bus Lines"],
        security: [{ session: ["basic"] }],
      },
    }
  )
  .put(
    "/:route_no",
    async ({ BusLinesService, params: { route_no }, body: { title } }) => {
      const line = await BusLinesService.updateLine(route_no, title);

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

      return {
        route_no: line.id,
        title: line.title,
      };
    },
    {
      params: t.Object({
        route_no: t.String(),
      }),
      body: t.Object({
        title: t.String({
          error: "Title must be a string",
        }),
      }),
      response: t.Object({
        title: t.Nullable(t.String()),
        route_no: t.Nullable(t.String()),
      }),
      detail: {
        summary: "Update a bus line",
        tags: ["Bus Lines"],
      },
    }
  );

// ? A physical Bus stop
type IBusStop = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  logicalId: string;
};

type INewBusStop = Omit<IBusStop, "id">;

// function split_directions(stops: IRouteCreationStop[]) {
//   const { outwardStops, inwardStops } = stops.reduce(
//     (acc, stop) => {
//       if (stop.direction === 1) {
//         acc.outwardStops.push(stop);
//       } else if (stop.direction === 2) {
//         acc.inwardStops.push(stop);
//       }
//       return acc;
//     },
//     {
//       outwardStops: [] as IRouteCreationStop[],
//       inwardStops: [] as IRouteCreationStop[],
//     }
//   );

//   return {
//     outwardStops,
//     inwardStops,
//   };
// }

// function set_routeway_breaks(stops: IRouteStop[]) {
//   stops[0].type = "break";
//   stops[stops.length - 1].type = "break";

//   return stops;
// }
