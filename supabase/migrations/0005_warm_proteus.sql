ALTER TABLE "user" ADD COLUMN "karma" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "preferred_city" text DEFAULT 'hcmc';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "preferred_root" text DEFAULT '';