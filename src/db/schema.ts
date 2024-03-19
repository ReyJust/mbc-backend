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

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  hashed_password: text("hashed_password").notNull(),
  email_verified: boolean("email_verified").default(false),
});

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const emailVerificationCodeTable = pgTable("email_verification_code", {
  id: serial("id"),
  code: text("code").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const passwordResetTokenTable = pgTable("password_reset_token", {
  tokenHash: text("token_hash").unique(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});
