import { Router } from "express";
import { db, diaperLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const babyId = req.query.babyId ? parseInt(req.query.babyId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    let query = db.select().from(diaperLogsTable).orderBy(desc(diaperLogsTable.loggedAt)).limit(limit);
    if (babyId) {
      query = db.select().from(diaperLogsTable).where(eq(diaperLogsTable.babyId, babyId)).orderBy(desc(diaperLogsTable.loggedAt)).limit(limit);
    }

    const logs = await query;
    return res.json(logs);
  } catch (err) {
    req.log.error({ err }, "Failed to get diaper logs");
    return res.status(500).json({ error: "Failed to get diaper logs" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { babyId, diaperType, notes, loggedAt } = req.body;
    if (!babyId || !diaperType || !loggedAt) {
      return res.status(400).json({ error: "babyId, diaperType, loggedAt are required" });
    }

    const [log] = await db.insert(diaperLogsTable).values({
      babyId,
      diaperType,
      notes: notes ?? null,
      loggedAt: new Date(loggedAt),
    }).returning();

    return res.status(201).json(log);
  } catch (err) {
    req.log.error({ err }, "Failed to create diaper log");
    return res.status(500).json({ error: "Failed to create diaper log" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(diaperLogsTable).where(eq(diaperLogsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete diaper log");
    return res.status(500).json({ error: "Failed to delete diaper log" });
  }
});

export default router;
