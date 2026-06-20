import { Router } from "express";
import { db, milestonesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const babyId = req.query.babyId ? parseInt(req.query.babyId as string) : undefined;

    let query = db.select().from(milestonesTable).orderBy(desc(milestonesTable.achievedAt));
    if (babyId) {
      query = db.select().from(milestonesTable).where(eq(milestonesTable.babyId, babyId)).orderBy(desc(milestonesTable.achievedAt));
    }

    const milestones = await query;
    return res.json(milestones);
  } catch (err) {
    req.log.error({ err }, "Failed to get milestones");
    return res.status(500).json({ error: "Failed to get milestones" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { babyId, title, description, category, achievedAt } = req.body;
    if (!babyId || !title || !category || !achievedAt) {
      return res.status(400).json({ error: "babyId, title, category, achievedAt are required" });
    }

    const [milestone] = await db.insert(milestonesTable).values({
      babyId,
      title,
      description: description ?? null,
      category,
      achievedAt,
    }).returning();

    return res.status(201).json(milestone);
  } catch (err) {
    req.log.error({ err }, "Failed to create milestone");
    return res.status(500).json({ error: "Failed to create milestone" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(milestonesTable).where(eq(milestonesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete milestone");
    return res.status(500).json({ error: "Failed to delete milestone" });
  }
});

export default router;
