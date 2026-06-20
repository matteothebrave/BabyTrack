import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feedingLogsTable = pgTable("feeding_logs", {
  id: serial("id").primaryKey(),
  babyId: integer("baby_id").notNull(),
  feedType: text("feed_type").notNull(),
  amount: real("amount"),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeedingLogSchema = createInsertSchema(feedingLogsTable).omit({ id: true, createdAt: true });
export type InsertFeedingLog = z.infer<typeof insertFeedingLogSchema>;
export type FeedingLog = typeof feedingLogsTable.$inferSelect;
