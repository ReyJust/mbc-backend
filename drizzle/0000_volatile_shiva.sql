DO $$ BEGIN
 CREATE TYPE "bus_stop_type" AS ENUM('via', 'break');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_fares" (
	"fare_stage" integer PRIMARY KEY NOT NULL,
	"adult_fare" integer,
	"child_fare" integer,
	"student_fare" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_lines" (
	"route_no" varchar(25) PRIMARY KEY NOT NULL,
	"title" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"fare_stage" integer,
	"average_journey_times_in_minutes" numeric,
	"direction" smallint,
	"route_no" varchar(25),
	"bus_stop_id" integer,
	"bus_stop_logical_id" varchar(50),
	"type" "bus_stop_type"
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_stops" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"latitude" real,
	"longitude" real,
	"logical_id" varchar(50)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"log_dt" timestamp,
	"route_no" varchar(25),
	"bus_stop_id" integer NOT NULL,
	"bus_stop_logical_id" varchar(50),
	"direction" smallint,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_verification_code" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "email_verification_code_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_token" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "password_reset_token_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"hashed_password" text NOT NULL,
	"email_verified" boolean DEFAULT false,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
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
 ALTER TABLE "bus_logs" ADD CONSTRAINT "bus_logs_route_no_bus_lines_route_no_fk" FOREIGN KEY ("route_no") REFERENCES "bus_lines"("route_no") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_logs" ADD CONSTRAINT "bus_logs_bus_stop_id_bus_stops_id_fk" FOREIGN KEY ("bus_stop_id") REFERENCES "bus_stops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_logs" ADD CONSTRAINT "bus_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_verification_code" ADD CONSTRAINT "email_verification_code_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
