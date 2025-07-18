CREATE TABLE "user_interactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_interactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"place_id" integer NOT NULL,
	"action" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_taste_profile" RENAME TO "user_preferences";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP CONSTRAINT "user_taste_profile_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_notes" ALTER COLUMN "place_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user_reviews" ALTER COLUMN "tried" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_reviews" ADD COLUMN "view_count" smallint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_reviews" ADD COLUMN "last_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_reviews" ADD COLUMN "liked" boolean;--> statement-breakpoint
ALTER TABLE "user_reviews" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;