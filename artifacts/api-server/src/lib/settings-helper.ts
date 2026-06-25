import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";

export async function getSettings() {
  const rows = await db.select().from(settingsTable).limit(1);
  return rows[0] ?? null;
}
