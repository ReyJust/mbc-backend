-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations

CREATE TABLE IF NOT EXISTS "bus_stops" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"latitude" numeric,
	"longitude" numeric,
	"logical_id" varchar(50)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_routes" (
	"id" integer PRIMARY KEY NOT NULL,
	"fare_stage" integer,
	"average_journey_times_in_minutes" numeric,
	"direction" integer,
	"route_no" varchar(25),
	"bus_stop_id" integer,
	"bus_stop_logical_id" varchar(50),
	"type" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_lines" (
	"route_no" varchar(25) PRIMARY KEY NOT NULL,
	"title" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_fares" (
	"fare_stage" integer PRIMARY KEY NOT NULL,
	"adult_fare" integer,
	"child_fare" integer,
	"student_fare" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_routes" ADD CONSTRAINT "bus_routes_bus_stop_id_fkey" FOREIGN KEY ("bus_stop_id") REFERENCES "public"."bus_stops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_routes" ADD CONSTRAINT "bus_routes_route_no_fkey" FOREIGN KEY ("route_no") REFERENCES "public"."bus_lines"("route_no") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_routes" ADD CONSTRAINT "bus_routes_fare_stage_fkey" FOREIGN KEY ("fare_stage") REFERENCES "public"."bus_fares"("fare_stage") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
