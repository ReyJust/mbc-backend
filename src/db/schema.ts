import {
  pgTable,
  integer,
  varchar,
  numeric,
  foreignKey,
  text,
  timestamp,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const busFares = pgTable("bus_fares", {
  fareStage: integer("fare_stage").primaryKey().notNull(),
  adultFare: integer("adult_fare"),
  childFare: integer("child_fare"),
  studentFare: integer("student_fare"),
});

export const busLines = pgTable("bus_lines", {
  routeNo: varchar("route_no", { length: 25 }).primaryKey().notNull(),
  title: varchar("title", { length: 255 }),
});

export const busStops = pgTable("bus_stops", {
  id: integer("id").primaryKey().notNull(),
  name: varchar("name", { length: 100 }),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  logicalId: varchar("logical_id", { length: 50 }),
});

export const busRoutes = pgTable("bus_routes", {
  id: integer("id").primaryKey().notNull(),
  fareStage: integer("fare_stage").references(() => busFares.fareStage),
  averageJourneyTimesInMinutes: numeric("average_journey_times_in_minutes"),
  direction: integer("direction"),
  routeNo: varchar("route_no", { length: 25 }).references(
    () => busLines.routeNo
  ),
  busStopId: integer("bus_stop_id").references(() => busStops.id),
  busStopLogicalId: varchar("bus_stop_logical_id", { length: 50 }),
  type: varchar("type", { length: 255 }),
});
