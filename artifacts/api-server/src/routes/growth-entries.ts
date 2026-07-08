import { Router } from "express";
import { db, growthEntriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const babyId = req.query.babyId ? parseInt(req.query.babyId as string) : undefined;
    let query = db.select().from(growthEntriesTable).orderBy(desc(growthEntriesTable.date));
    if (babyId) {
      query = db.select().from(growthEntriesTable).where(eq(growthEntriesTable.babyId, babyId)).orderBy(desc(growthEntriesTable.date));
    }
    const entries = await query;
    return res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to get growth entries");
    return res.status(500).json({ error: "Failed to get growth entries" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { babyId, date, weightKg, heightCm, headCm, notes } = req.body;
    if (!babyId || !date) return res.status(400).json({ error: "babyId and date required" });
    const [entry] = await db.insert(growthEntriesTable).values({
      babyId,
      date,
      weightKg: weightKg ?? null,
      heightCm: heightCm ?? null,
      headCm: headCm ?? null,
      notes: notes ?? null,
    }).returning();
    return res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to create growth entry");
    return res.status(500).json({ error: "Failed to create growth entry" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(growthEntriesTable).where(eq(growthEntriesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete growth entry");
    return res.status(500).json({ error: "Failed to delete growth entry" });
  }
});

export default router;
