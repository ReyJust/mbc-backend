import { eq, or, ilike, asc, and } from "drizzle-orm";
import type { IDatabase } from "../types";
import { busLines, busRoutes } from "../db/schema";
import { AlreadyExistsError } from "../utils/errors";
import { NotFoundError } from "elysia";
import type { IRouteStop } from "../types/bus-lines";

export class BusLinesService {
  private db: IDatabase;

  constructor(db: IDatabase) {
    this.db = db;
  }

  public getLines = async (query: string | undefined) => {
    const allLines = await this.db.db
      .select()
      .from(busLines)
      .where(
        or(
          query ? ilike(busLines.id, `%${query}%`) : undefined,
          query ? ilike(busLines.title, `%${query}%`) : undefined
        )
      );

    return allLines.reduce((acc, curr) => {
      acc[curr.id] = curr.title;
      return acc;
    }, {} as Record<string, string | null>);
  };

  public getLine = async (line_no: string) => {
    const busLine = await this.db.db.query.busLines.findFirst({
      where: eq(busLines.id, line_no),
    });

    if (!busLine) {
      throw new NotFoundError(`Bus line ${line_no} not found`);
    }

    return busLine;
  };

  public getLineRoute = async (line_no: string, direction?: number) => {
    const condition = [eq(busRoutes.routeNo, line_no)];

    if (direction) {
      //Filter by direction if asked
      condition.push(eq(busRoutes.direction, direction));
    }

    const lineRoute = await this.db.db
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

    return lineRoute;
  };

  public createLine = async (
    line_no: string,
    title: string,
    stops: {
      inward: IRouteStop[];
      outward: IRouteStop[];
    }
  ) => {
    let line: {
      id: string;
      title: string | null;
    };

    try {
      const createLine = await this.db.db
        .insert(busLines)
        .values({
          id: line_no,
          title,
        })
        .returning();
      line = createLine[0];
    } catch (e) {
      throw new AlreadyExistsError(`Route ${line_no} already exists`);
    }

    try {
      let routeData = [...stops.inward, ...stops.outward].map((stops) => {
        return {
          busStopId: stops.bus_stop_id,
          routeNo: line_no,
          averageJourneyTimesInMinutes: String(stops.average_journey_time),
          fareStage: stops.fare_stage,
          direction: stops.direction,
          type: stops.type,
        };
      });

      const route = await this.db.db
        .insert(busRoutes)
        .values(routeData)
        .returning();

      return {
        route_no: line.id,
        title: line.title,
        stops: route,
      };
    } catch (e) {
      // Delete the line if the route creation fails
      await this.db.db.delete(busLines).where(eq(busLines.id, line_no));
      // console.log(e);
      throw new Error(`Failed to create route for ${line_no}`);
    }
  };

  public updateLine = async (line_no: string, title: string) => {
    const line = await this.db.db
      .update(busLines)
      .set({
        title,
      })
      .where(eq(busLines.id, line_no))
      .returning();

    if (line.length === 0) {
      throw new NotFoundError(`Bus line ${line_no} not found`);
    }

    return line[0];
  };
}
