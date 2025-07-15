ALTER TABLE "places" ALTER COLUMN "added_by" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_notes" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user_notes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "user_notes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_added_by_user_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;