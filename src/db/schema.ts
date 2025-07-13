import {
  bigint,
  pgTable,
  serial,
  text,
  timestamp,
  smallint,
  doublePrecision,
} from "drizzle-orm/pg-core";

// Import auth schema
export * from "../../auth-schema";

export const placesTable = pgTable("places", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  type: text("type").default("classic"),
  specificType: text("specific_type"),
  osmId: text("osm_id"),
  displayName: text("display_name"),
  karma: smallint("karma").default(0),
  lat: doublePrecision("lat"),
  long: doublePrecision("long"),
  city: text("city"),
  imagePath: text("image_path"),
  price: smallint("price").default(0),
  addedBy: text("added_by").default("anon"),
});

export type InsertPlace = typeof placesTable.$inferInsert;
export type SelectPlace = typeof placesTable.$inferSelect;
