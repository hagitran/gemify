CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"cozy" double precision DEFAULT 0.5 NOT NULL,
	"lively" double precision DEFAULT 0.5 NOT NULL,
	"work_friendly" double precision DEFAULT 0.5 NOT NULL,
	"trendy" double precision DEFAULT 0.5 NOT NULL,
	"traditional" double precision DEFAULT 0.5 NOT NULL,
	"romantic" double precision DEFAULT 0.5 NOT NULL,
	"price" double precision DEFAULT 0.5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;