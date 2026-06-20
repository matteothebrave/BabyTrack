import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const diaperLogsTable = pgTable("diaper_logs", {
  id: serial("id").primaryKey(),
  babyId: integer("baby_id").notNull(),
  diaperType: text("diaper_type").notNull(),
  notes: text("notes"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDiaperLogSchema = createInsertSchema(diaperLogsTable).omit({ id: true, createdAt: true });
export type InsertDiaperLog = z.infer<typeof insertDiaperLogSchema>;
export type DiaperLog = typeof diaperLogsTable.$inferSelect;
