CREATE TABLE "places" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text DEFAULT 'classic',
	"specific_type" text,
	"osm_id" text,
	"display_name" text,
	"karma" smallint DEFAULT 0,
	"lat" double precision,
	"long" double precision,
	"city" text,
	"image_path" text,
	"price" smallint DEFAULT 0,
	"added_by" text DEFAULT 'anon'
);
