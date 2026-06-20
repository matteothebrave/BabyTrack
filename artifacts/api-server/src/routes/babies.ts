import { Router } from "express";
import { db, babiesTable, feedingLogsTable, diaperLogsTable, sleepLogsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const babies = await db.select().from(babiesTable).orderBy(babiesTable.createdAt);
    return res.json(babies);
  } catch (err) {
    req.log.error({ err }, "Failed to get babies");
    return res.status(500).json({ error: "Failed to get babies" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, gender, birthDate, colorHex, notes } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const [baby] = await db.insert(babiesTable).values({
      name,
      gender: gender ?? null,
      birthDate: birthDate ?? null,
      colorHex: colorHex ?? "#6366f1",
      notes: notes ?? null,
    }).returning();

    return res.status(201).json(baby);
  } catch (err) {
    req.log.error({ err }, "Failed to create baby");
    return res.status(500).json({ error: "Failed to create baby" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [baby] = await db.select().from(babiesTable).where(eq(babiesTable.id, id));
    if (!baby) return res.status(404).json({ error: "Baby not found" });
    return res.json(baby);
  } catch (err) {
    req.log.error({ err }, "Failed to get baby");
    return res.status(500).json({ error: "Failed to get baby" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, gender, birthDate, colorHex, notes } = req.body;

    const [updated] = await db
      .update(babiesTable)
      .set({
        ...(name !== undefined && { name }),
        ...(gender !== undefined && { gender }),
        ...(birthDate !== undefined && { birthDate }),
        ...(colorHex !== undefined && { colorHex }),
        ...(notes !== undefined && { notes }),
      })
      .where(eq(babiesTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Baby not found" });
    return res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update baby");
    return res.status(500).json({ error: "Failed to update baby" });
  }
});

router.get("/:id/today", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [baby] = await db.select().from(babiesTable).where(eq(babiesTable.id, id));
    if (!baby) return res.status(404).json({ error: "Baby not found" });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const feedings = await db.select().from(feedingLogsTable)
      .where(and(eq(feedingLogsTable.babyId, id), gte(feedingLogsTable.loggedAt, todayStart), lte(feedingLogsTable.loggedAt, todayEnd)))
      .orderBy(feedingLogsTable.loggedAt);

    const diapers = await db.select().from(diaperLogsTable)
      .where(and(eq(diaperLogsTable.babyId, id), gte(diaperLogsTable.loggedAt, todayStart), lte(diaperLogsTable.loggedAt, todayEnd)));

    const sleeps = await db.select().from(sleepLogsTable)
      .where(and(eq(sleepLogsTable.babyId, id), gte(sleepLogsTable.startTime, todayStart), lte(sleepLogsTable.startTime, todayEnd)));

    let sleepMinutes = 0;
    for (const s of sleeps) {
      if (s.endTime) {
        sleepMinutes += Math.round((s.endTime.getTime() - s.startTime.getTime()) / 60000);
      }
    }

    const lastFeeding = feedings[feedings.length - 1];
    const lastDiaper = diapers.sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime())[0];

    return res.json({
      babyId: id,
      babyName: baby.name,
      feedingCount: feedings.length,
      diaperCount: diapers.length,
      sleepMinutes,
      lastFed: lastFeeding ? lastFeeding.loggedAt.toISOString() : null,
      lastDiaper: lastDiaper ? lastDiaper.loggedAt.toISOString() : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get baby today summary");
    return res.status(500).json({ error: "Failed to get today summary" });
  }
});

export default router;
