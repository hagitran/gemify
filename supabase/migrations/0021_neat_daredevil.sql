CREATE TABLE "itinerary_places" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "itinerary_places_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"itinerary_id" integer NOT NULL,
	"place_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "itinerary_places" ADD CONSTRAINT "itinerary_places_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_places" ADD CONSTRAINT "itinerary_places_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;