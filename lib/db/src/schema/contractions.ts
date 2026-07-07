import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contractionsTable = pgTable("contractions", {
  id: serial("id").primaryKey(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),
  durationSeconds: integer("duration_seconds"),
  intervalSeconds: integer("interval_seconds"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContractionSchema = createInsertSchema(contractionsTable).omit({ id: true, createdAt: true });
export type InsertContraction = z.infer<typeof insertContractionSchema>;
export type Contraction = typeof contractionsTable.$inferSelect;
