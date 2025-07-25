import {
  bigint,
  pgTable,
  text,
  timestamp,
  smallint,
  doublePrecision,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";

// Import auth schema
import { user } from "../../auth-schema";

export * from "../../auth-schema";

// === Places Table ===
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
  verified: boolean("verified").default(false),
  viewCount: smallint("view_count").default(0),
});

// === User Notes Table ===
export const userNotesTable = pgTable("user_notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").references(() => user.id),
  placeId: integer("place_id")
    .notNull()
    .references(() => placesTable.id),
  note: text("note"),
  imagePath: text("image_path"),
});

// === User Reviews Table ===
export const userReviewsTable = pgTable("user_reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id").references(() => user.id),
  placeId: bigint("place_id", { mode: "number" })
    .notNull()
    .references(() => placesTable.id),

  // Interaction-specific
  tried: boolean("tried").default(false),
  recommendedItem: text("recommended_item"),
  price: smallint("price"),
  ambiance: text("ambiance"),

  // Feedback
  note: text("note"),
  imagePath: text("image_path"),
});

export const userPreferencesTable = pgTable("user_preferences", {
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
// === User Interactions Table (for short-term taste tracking) ===
export const userInteractionsTable = pgTable("user_interactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  placeId: integer("place_id")
    .notNull()
    .references(() => placesTable.id),
  action: text("action"), // "liked", "saved", "dismissed", etc.
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const listsTable = pgTable("lists", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: text("created_by").references(() => user.id),
  karma: smallint("karma").default(0),
  verified: boolean("verified").default(false),
});

export const listMembersTable = pgTable("list_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  listId: integer("list_id")
    .notNull()
    .references(() => listsTable.id),
});

// === list Places Table ===
export const listPlacesTable = pgTable("list_places", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  listId: integer("list_id")
    .notNull()
    .references(() => listsTable.id),
  placeId: integer("place_id")
    .notNull()
    .references(() => placesTable.id),
});

// === Types ===
export type InsertPlace = typeof placesTable.$inferInsert;
export type SelectPlace = typeof placesTable.$inferSelect;
export type InsertUserNote = typeof userNotesTable.$inferInsert;
export type SelectUserNote = typeof userNotesTable.$inferSelect;
export type InsertUserReview = typeof userReviewsTable.$inferInsert;
export type SelectUserReview = typeof userReviewsTable.$inferSelect;
export type InsertUserPreference = typeof userPreferencesTable.$inferInsert;
export type SelectUserPreference = typeof userPreferencesTable.$inferSelect;
export type InsertUserInteraction = typeof userInteractionsTable.$inferInsert;
export type SelectUserInteraction = typeof userInteractionsTable.$inferSelect;
export type InsertList = typeof listsTable.$inferInsert;
export type SelectList = typeof listsTable.$inferSelect;
export type InsertListMember = typeof listMembersTable.$inferInsert;
export type SelectListMember = typeof listMembersTable.$inferSelect;
