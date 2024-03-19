CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bus_routes" DROP CONSTRAINT "bus_routes_bus_stop_id_fkey";
--> statement-breakpoint
ALTER TABLE "bus_routes" DROP CONSTRAINT "bus_routes_route_no_fkey";
--> statement-breakpoint
ALTER TABLE "bus_routes" DROP CONSTRAINT "bus_routes_fare_stage_fkey";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_routes" ADD CONSTRAINT "bus_routes_fare_stage_bus_fares_fare_stage_fk" FOREIGN KEY ("fare_stage") REFERENCES "bus_fares"("fare_stage") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_routes" ADD CONSTRAINT "bus_routes_route_no_bus_lines_route_no_fk" FOREIGN KEY ("route_no") REFERENCES "bus_lines"("route_no") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_routes" ADD CONSTRAINT "bus_routes_bus_stop_id_bus_stops_id_fk" FOREIGN KEY ("bus_stop_id") REFERENCES "bus_stops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
