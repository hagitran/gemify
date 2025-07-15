import {
  bigint,
  pgTable,
  text,
  timestamp,
  smallint,
  doublePrecision,
  integer,
} from "drizzle-orm/pg-core";

// Import auth schema
import { user } from "../../auth-schema";

export * from "../../auth-schema";

export const placesTable = pgTable("places", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").unique(),
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
  addedBy: text("added_by").references(() => user.id),
});

export const userNotesTable = pgTable("user_notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").references(() => user.id),
  placeId: bigint("place_id", { mode: "number" })
    .notNull()
    .references(() => placesTable.id),
  note: text("note"),
  imagePath: text("image_path"),
});

export type InsertPlace = typeof placesTable.$inferInsert;
export type SelectPlace = typeof placesTable.$inferSelect;
export type InsertUserNote = typeof userNotesTable.$inferInsert;
export type SelectUserNote = typeof userNotesTable.$inferSelect;
