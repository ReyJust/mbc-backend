import type { IDatabase } from "../types";
import { eq, and, or, asc, ilike } from "drizzle-orm";
import { busStops, busLines, busRoutes, busStopsLogs } from "../db/schema";
import { NotFoundError } from "elysia";

export class BusStopsService {
  private db: IDatabase;

  constructor(db: IDatabase) {
    this.db = db;
  }

  public getBusStops = async (query: string | undefined, offset: string) => {
    const allBusStops = await this.db.db
      .select()
      .from(busStops)
      .where(or(query ? ilike(busStops.name, `%${query}%`) : undefined))
      .offset(parseInt(offset))
      .limit(100);

    return allBusStops.reduce((acc, curr) => {
      acc[curr.id] = curr.name;
      return acc;
    }, {} as Record<string, string | null>);
  };

  public getBusStop = async (bus_stop_id: number) => {
    const busStop = await this.db.db.query.busStops.findFirst({
      where: eq(busStops.id, bus_stop_id),
    });

    if (!busStop) {
      throw new NotFoundError(`Bus stop ${bus_stop_id} not found`);
    }

    return busStop;
  };

  /**
   * Get all bus lines that pass through a bus stop
   */
  public getBusStopBusLines = async (bus_stop_id: number) => {
    const linkedBusLines = await this.db.db
      .selectDistinctOn([busRoutes.routeNo], {
        title: busLines.title,
        id: busLines.id,
      })
      .from(busRoutes)
      .innerJoin(busLines, eq(busRoutes.routeNo, busLines.id))
      .where(eq(busRoutes.id, bus_stop_id));

    return linkedBusLines.reduce((acc, line) => {
      acc[line.id] = line.title;

      return acc;
    }, {} as { [id: string]: string | null });
  };

  public getBusStopLogs = async (
    bus_stop_id: number,
    route_no?: string,
    direction?: number
  ) => {
    const condition = [eq(busStopsLogs.busStopId, bus_stop_id)];

    if (route_no) {
      //Filter by direction if asked
      condition.push(eq(busStopsLogs.routeNo, route_no));
    }

    if (direction) {
      //Filter by direction if asked
      condition.push(eq(busStopsLogs.direction, direction));
    }

    return await this.db.db
      .select()
      .from(busStopsLogs)
      .where(and(...condition))
      .orderBy(asc(busStopsLogs.direction));
  };

  public getNearestBusStops = async (coordinates: {
    lat: number;
    lng: number;
  }) => {
    // TODO: Use PostGIS to do this
    throw new Error("Not implemented");
  };

  public createBusStop = async (busStopData: {
    name: string;
    latitude: number;
    longitude: number;
  }) => {
    // ? Since we don't pass the bus stop id (serial), there is no risk to create an already existing.
    const busStop = await this.db.db
      .insert(busStops)
      .values(busStopData)
      .returning();

    return busStop[0];
  };

  public updateBusStop = async (
    id: number,
    busStopData: {
      name: string;
      latitude: number;
      longitude: number;
    }
  ) => {
    const busStop = await this.db.db
      .update(busStops)
      .set(busStopData)
      .where(eq(busStops.id, id))
      .returning();

    if (busStop.length === 0) {
      throw new NotFoundError(`Bus Stop ${id} not found`);
    }

    return busStop[0];
  };

  public createBusStopLog = async (
    id: number,
    line_no: string,
    log_dt: Date,
    direction: number,
    userId: string
  ) => {
    return await this.db.db
      .insert(busStopsLogs)
      .values({
        busStopId: id,
        direction,
        routeNo: line_no,
        logDate: log_dt,
        userId,
      })
      .returning();
  };
}
