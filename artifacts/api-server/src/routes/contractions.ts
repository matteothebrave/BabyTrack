import { Router } from "express";
import { db } from "@workspace/db";
import { contractionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const contractions = await db.select().from(contractionsTable)
      .orderBy(desc(contractionsTable.startTime))
      .limit(100);
    return res.json(contractions);
  } catch (err) {
    req.log.error({ err }, "Failed to get contractions");
    return res.status(500).json({ error: "Failed to get contractions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { startTime, endTime, durationSeconds, intervalSeconds, notes } = req.body;
    if (!startTime) {
      return res.status(400).json({ error: "startTime is required" });
    }
    const [contraction] = await db.insert(contractionsTable).values({
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      durationSeconds: durationSeconds ?? null,
      intervalSeconds: intervalSeconds ?? null,
      notes: notes ?? null,
    }).returning();
    return res.status(201).json(contraction);
  } catch (err) {
    req.log.error({ err }, "Failed to create contraction" );
    return res.status(500).json({ error: "Failed to create contraction" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(contractionsTable).where(eq(contractionsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete contraction");
    return res.status(500).json({ error: "Failed to delete contraction" });
  }
});

router.delete("/", async (req, res) => {
  try {
    await db.delete(contractionsTable);
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to clear contractions");
    return res.status(500).json({ error: "Failed to clear contractions" });
  }
});

export default router;
