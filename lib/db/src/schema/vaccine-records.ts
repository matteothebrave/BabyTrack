import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vaccineRecordsTable = pgTable("vaccine_records", {
  id: serial("id").primaryKey(),
  babyId: integer("baby_id").notNull(),
  vaccineKey: text("vaccine_key").notNull(),
  givenDate: text("given_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVaccineRecordSchema = createInsertSchema(vaccineRecordsTable).omit({ id: true, createdAt: true });
export type InsertVaccineRecord = z.infer<typeof insertVaccineRecordSchema>;
export type VaccineRecord = typeof vaccineRecordsTable.$inferSelect;
