CREATE TABLE "user_taste_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"engagement_style" double precision DEFAULT 0.5 NOT NULL,
	"novelty_seeking" double precision DEFAULT 0.5 NOT NULL,
	"price_elasticity" double precision DEFAULT 0.5 NOT NULL,
	"aesthetic_sensitivity" double precision DEFAULT 0.5 NOT NULL,
	"health_consciousness" double precision DEFAULT 0.5 NOT NULL,
	"social_mode" double precision DEFAULT 0.5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "preferred_city" SET DEFAULT 'sf';--> statement-breakpoint
ALTER TABLE "user_taste_profile" ADD CONSTRAINT "user_taste_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;