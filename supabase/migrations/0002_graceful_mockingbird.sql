ALTER TABLE "lists" ADD COLUMN "verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "verified" boolean DEFAULT false;