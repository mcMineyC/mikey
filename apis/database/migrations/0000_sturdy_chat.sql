CREATE TABLE "people" (
	"id" serial PRIMARY KEY NOT NULL,
	"planning_center_id" text,
	"name" varchar,
	"position_name" varchar,
	"thumbnail_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "people_planning_center_id_unique" UNIQUE("planning_center_id")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"planning_center_id" text,
	"title" varchar,
	"start_time" timestamp,
	"duration" integer,
	"planning_center_url" text,
	"person_ids" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "plans_planning_center_id_unique" UNIQUE("planning_center_id")
);
