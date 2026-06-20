import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const babiesTable = pgTable("babies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gender: text("gender"),
  birthDate: text("birth_date"),
  colorHex: text("color_hex").notNull().default("#6366f1"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBabySchema = createInsertSchema(babiesTable).omit({ id: true, createdAt: true });
export type InsertBaby = z.infer<typeof insertBabySchema>;
export type Baby = typeof babiesTable.$inferSelect;
