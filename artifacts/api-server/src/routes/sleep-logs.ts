import { Router } from "express";
import { db, sleepLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const babyId = req.query.babyId ? parseInt(req.query.babyId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    let query = db.select().from(sleepLogsTable).orderBy(desc(sleepLogsTable.startTime)).limit(limit);
    if (babyId) {
      query = db.select().from(sleepLogsTable).where(eq(sleepLogsTable.babyId, babyId)).orderBy(desc(sleepLogsTable.startTime)).limit(limit);
    }

    const logs = await query;
    return res.json(logs);
  } catch (err) {
    req.log.error({ err }, "Failed to get sleep logs");
    return res.status(500).json({ error: "Failed to get sleep logs" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { babyId, startTime, endTime, notes } = req.body;
    if (!babyId || !startTime) {
      return res.status(400).json({ error: "babyId, startTime are required" });
    }

    const [log] = await db.insert(sleepLogsTable).values({
      babyId,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      notes: notes ?? null,
    }).returning();

    return res.status(201).json(log);
  } catch (err) {
    req.log.error({ err }, "Failed to create sleep log");
    return res.status(500).json({ error: "Failed to create sleep log" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(sleepLogsTable).where(eq(sleepLogsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete sleep log");
    return res.status(500).json({ error: "Failed to delete sleep log" });
  }
});

export default router;
