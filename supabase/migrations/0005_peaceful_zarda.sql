ALTER TABLE "places" ADD COLUMN "view_count" smallint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_reviews" DROP COLUMN "view_count";--> statement-breakpoint
ALTER TABLE "user_reviews" DROP COLUMN "last_viewed_at";