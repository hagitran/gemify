import {
  bigint,
  pgTable,
  text,
  timestamp,
  smallint,
  doublePrecision,
  integer,
  boolean,
  uniqueIndex,
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
export const userReviewsTable = pgTable(
  "user_reviews",
  {
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

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueUserPlace: uniqueIndex("user_reviews_unique_user_place").on(
      table.userId,
      table.placeId
    ),
  })
);

// === User Preferences Table ===
export const userPreferencesTable = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id),

  // Ambiance preferences (0 = dislike, 1 = like)
  cozy: doublePrecision("cozy").notNull().default(0.5),
  lively: doublePrecision("lively").notNull().default(0.5),
  workFriendly: doublePrecision("work_friendly").notNull().default(0.5),
  trendy: doublePrecision("trendy").notNull().default(0.5),
  traditional: doublePrecision("traditional").notNull().default(0.5),
  romantic: doublePrecision("romantic").notNull().default(0.5),
  price1: doublePrecision("price").notNull().default(0.5), // $
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// === User Interactions Table (for short-term taste tracking) ===
export const userInteractionsTable = pgTable(
  "user_interactions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    placeId: integer("place_id")
      .notNull()
      .references(() => placesTable.id),
    action: text("action").notNull(), // "view", "try", "like", etc.
    count: integer("count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueTriplet: uniqueIndex("user_interactions_unique_triplet").on(
      table.userId,
      table.placeId,
      table.action
    ),
  })
);

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
  placeCount: smallint("place_count").default(0),
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
export const listPlacesTable = pgTable(
  "list_places",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    listId: integer("list_id")
      .notNull()
      .references(() => listsTable.id),
    placeId: integer("place_id")
      .notNull()
      .references(() => placesTable.id),
  },
  (table) => ({
    uniqueListPlace: uniqueIndex("unique_list_place").on(
      table.listId,
      table.placeId
    ),
  })
);

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
