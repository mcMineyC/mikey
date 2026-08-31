CREATE TABLE "plan_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"role" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_assignments_plan_person_role_unique" UNIQUE("plan_id","person_id","role")
);
--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "planning_center_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "planning_center_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "position_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "thumbnail_url" SET DATA TYPE varchar(1000);--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "planning_center_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "planning_center_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "start_time" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "planning_center_url" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plan_assignments" ADD CONSTRAINT "plan_assignments_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_assignments" ADD CONSTRAINT "plan_assignments_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plan_assignments_plan_id_idx" ON "plan_assignments" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plan_assignments_person_id_idx" ON "plan_assignments" USING btree ("person_id");--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN "person_ids";