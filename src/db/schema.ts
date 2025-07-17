import {
  bigint,
  pgTable,
  text,
  timestamp,
  smallint,
  doublePrecision,
  integer,
  boolean,
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
  ambiance: text("ambiance").array(),
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

export const userReviewsTable = pgTable("user_reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").references(() => user.id),
  placeId: bigint("place_id", { mode: "number" })
    .notNull()
    .references(() => placesTable.id),
  tried: boolean("tried"),
  recommendedItem: text("recommended_item"),
  price: smallint("price"),
  ambiance: text("ambiance"),
});

/**
 * MVP Taste Profile: captures core user taste dimensions
 */
export const userTasteProfile = pgTable("user_taste_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id),
  engagementStyle: doublePrecision("engagement_style").notNull().default(0.5), // 0 = utilitarian, 1 = experiential
  noveltySeeking: doublePrecision("novelty_seeking").notNull().default(0.5), // 0 = safe/familiar, 1 = adventurous
  priceElasticity: doublePrecision("price_elasticity").notNull().default(0.5), // 0 = budget-first, 1 = free-spending
  aestheticSensitivity: doublePrecision("aesthetic_sensitivity")
    .notNull()
    .default(0.5), // 0 = functional, 1 = design-first
  healthConsciousness: doublePrecision("health_consciousness")
    .notNull()
    .default(0.5), // 0 = indulgence, 1 = health-first
  socialMode: doublePrecision("social_mode").notNull().default(0.5), // 0 = solo, 1 = group-oriented
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertPlace = typeof placesTable.$inferInsert;
export type SelectPlace = typeof placesTable.$inferSelect;
export type InsertUserNote = typeof userNotesTable.$inferInsert;
export type SelectUserNote = typeof userNotesTable.$inferSelect;
export type InsertUserReview = typeof userReviewsTable.$inferInsert;
export type SelectUserReview = typeof userReviewsTable.$inferSelect;
export type InsertUserTasteProfile = typeof userTasteProfile.$inferInsert;
export type SelectUserTasteProfile = typeof userTasteProfile.$inferSelect;
