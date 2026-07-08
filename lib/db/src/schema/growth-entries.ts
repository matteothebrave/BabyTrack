import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const growthEntriesTable = pgTable("growth_entries", {
  id: serial("id").primaryKey(),
  babyId: integer("baby_id").notNull(),
  date: text("date").notNull(),
  weightKg: real("weight_kg"),
  heightCm: real("height_cm"),
  headCm: real("head_cm"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGrowthEntrySchema = createInsertSchema(growthEntriesTable).omit({ id: true, createdAt: true });
export type InsertGrowthEntry = z.infer<typeof insertGrowthEntrySchema>;
export type GrowthEntry = typeof growthEntriesTable.$inferSelect;
