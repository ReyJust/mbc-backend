import { Elysia, NotFoundError, t, ValidationError } from "elysia";
import init_database from "../../db";
import { eq, or, ilike, asc, and } from "drizzle-orm";
import { busLines, busRoutes, busStops } from "../../db/schema";
import { sessionMiddleware } from "../../middlewares";

const db = new Elysia({ name: "db" }).decorate("db", await init_database());

export const busLinesController = new Elysia({
  prefix: "/bus-lines",
})
  .use(db)
  .get(
    "/",
    async ({ db, query: { q } }) => {
      const allRoutes = await db.db
        .select()
        .from(busLines)
        .where(
          or(
            q ? ilike(busLines.id, `%${q}%`) : undefined,
            q ? ilike(busLines.title, `%${q}%`) : undefined
          )
        );

      const a = allRoutes.reduce((acc, curr) => {
        acc[curr.id] = curr.title;
        return acc;
      }, {} as Record<string, string | null>);

      return a;
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
    async ({ db, params: { route_no }, query: { direction } }) => {
      const busLine = await db.db.query.busLines.findFirst({
        where: eq(busLines.id, route_no),
      });

      if (!busLine) {
        throw new NotFoundError(`Bus line ${route_no} not found`);
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
        route_no: busLine.id,
        stops: Object.values(route),
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
    async ({ db, body: { route_no, title, stops } }) => {
      let line: {
        id: string;
        title: string | null;
      };

      try {
        const createLine = await db.db
          .insert(busLines)
          .values({
            id: route_no,
            title,
          })
          .returning();
        line = createLine[0];
      } catch (e) {
        throw new AlreadyExistsError(`Route ${route_no} already exists`);
      }

      try {
        let routeData = [...stops.inward, ...stops.outward].map((stops) => {
          return {
            busStopId: stops.bus_stop_id,
            routeNo: route_no,
            averageJourneyTimesInMinutes: String(stops.average_journey_time),
            fareStage: stops.fare_stage,
            direction: stops.direction,
            type: stops.type,
          };
        });

        const route = await db.db
          .insert(busRoutes)
          .values(routeData)
          .returning();

        console.log(route);

        return {
          route_no: line.id,
          title: line.title,
          stops: route,
        };
      } catch (e) {
        // Delete the line if the route creation fails
        await db.db.delete(busLines).where(eq(busLines.id, route_no));
        console.log(e);
        throw new Error(`Failed to create route for ${route_no}`);
      }
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
              type: t.Nullable(t.Enum({ via: "via", break: "break" })),
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
    async ({ db, params: { route_no }, body: { title } }) => {
      const line = await db.db
        .update(busLines)
        .set({
          title,
        })
        .where(eq(busLines.id, route_no))
        .returning();
      
      if (line.length === 0 ) {
        throw new NotFoundError(`Bus line ${route_no} not found`);
      }
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
        route_no: line[0].id,
        title: line[0].title,
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

// ? A route stop that reference a bus stop
type IRouteStop = {
  busStopId: number;
  fareStage: number;
  direction: number;
  routeNo: string;
  type: "via" | "break";
};

// Create a custom error for already existing items
class AlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlreadyExistsError";
  }
}

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
