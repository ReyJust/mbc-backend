import { Elysia, t } from "elysia";
import init_database from "../db";
import { eq, or, ilike } from "drizzle-orm";
import { busLines } from "../db/schema";
import swagger from "@elysiajs/swagger";

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
        description: "Search / List bus lines",
      }),
    }
  )
  .get(
    "/:route_no",
    async ({ db, params }) => {
      const res = await db.db.query.busLines.findFirst({
        where: eq(busLines.routeNo, params.route_no),
      });

      return res;
    },
    {
      params: t.Object({
        route_no: t.String(),
      }),
      response: t.MaybeEmpty(
        t.Object(
          {
            routeNo: t.String(),
            title: t.String(),
          },
          { description: "Create a new bus line" }
        )
      ),
    }
  )
  .post(
    "/",
    async ({ db, body }) => {
      // const createRoute = await db.db.insert(busLines).values(body);
    },
    {
      body: t.Object({
        route_no: t.String(),
        title: t.String(),
        bus_stops: t.Array(
          t.Object({
            bus_stop_id: t.String(),
            fare_stage: t.Number(),
            average_journey_time: t.Number(),
          })
        ),
      }),
      response: t.Object({}, { description: "Create a new bus line" }),
    }
  );
