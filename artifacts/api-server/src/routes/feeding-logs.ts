import { Router } from "express";
import { db, feedingLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const babyId = req.query.babyId ? parseInt(req.query.babyId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    let query = db.select().from(feedingLogsTable).orderBy(desc(feedingLogsTable.loggedAt)).limit(limit);
    if (babyId) {
      query = db.select().from(feedingLogsTable).where(eq(feedingLogsTable.babyId, babyId)).orderBy(desc(feedingLogsTable.loggedAt)).limit(limit);
    }

    const logs = await query;
    return res.json(logs);
  } catch (err) {
    req.log.error({ err }, "Failed to get feeding logs");
    return res.status(500).json({ error: "Failed to get feeding logs" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { babyId, feedType, amount, durationMinutes, notes, loggedAt } = req.body;
    if (!babyId || !feedType || !loggedAt) {
      return res.status(400).json({ error: "babyId, feedType, loggedAt are required" });
    }

    const [log] = await db.insert(feedingLogsTable).values({
      babyId,
      feedType,
      amount: amount ?? null,
      durationMinutes: durationMinutes ?? null,
      notes: notes ?? null,
      loggedAt: new Date(loggedAt),
    }).returning();

    return res.status(201).json(log);
  } catch (err) {
    req.log.error({ err }, "Failed to create feeding log");
    return res.status(500).json({ error: "Failed to create feeding log" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(feedingLogsTable).where(eq(feedingLogsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete feeding log");
    return res.status(500).json({ error: "Failed to delete feeding log" });
  }
});

export default router;
