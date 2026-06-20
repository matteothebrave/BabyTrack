import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(settingsTable).limit(1);
    if (rows.length === 0) {
      const [created] = await db.insert(settingsTable).values({ parentName: "", momName: "", dueDate: null }).returning();
      return res.json(created);
    }
    return res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    return res.status(500).json({ error: "Failed to get settings" });
  }
});

router.put("/", async (req, res) => {
  try {
    const { parentName, momName, dueDate } = req.body;
    const rows = await db.select().from(settingsTable).limit(1);

    if (rows.length === 0) {
      const [created] = await db.insert(settingsTable).values({ parentName: parentName ?? "", momName: momName ?? "", dueDate: dueDate ?? null }).returning();
      return res.json(created);
    }

    const [updated] = await db
      .update(settingsTable)
      .set({ parentName: parentName ?? rows[0].parentName, momName: momName ?? rows[0].momName, dueDate: dueDate !== undefined ? dueDate : rows[0].dueDate })
      .where(eq(settingsTable.id, rows[0].id))
      .returning();

    return res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    return res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
