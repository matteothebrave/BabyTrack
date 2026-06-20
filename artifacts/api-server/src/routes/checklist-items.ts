import { Router } from "express";
import { db, checklistItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const category = req.query.category as string | undefined;

    let query = db.select().from(checklistItemsTable).orderBy(checklistItemsTable.createdAt);
    if (category) {
      query = db.select().from(checklistItemsTable).where(eq(checklistItemsTable.category, category)).orderBy(checklistItemsTable.createdAt);
    }

    const items = await query;
    return res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to get checklist items");
    return res.status(500).json({ error: "Failed to get checklist items" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { category, title, notes } = req.body;
    if (!category || !title) {
      return res.status(400).json({ error: "category, title are required" });
    }

    const [item] = await db.insert(checklistItemsTable).values({
      category,
      title,
      completed: false,
      notes: notes ?? null,
    }).returning();

    return res.status(201).json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to create checklist item");
    return res.status(500).json({ error: "Failed to create checklist item" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, completed, notes } = req.body;

    const [updated] = await db
      .update(checklistItemsTable)
      .set({
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed }),
        ...(notes !== undefined && { notes }),
      })
      .where(eq(checklistItemsTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Item not found" });
    return res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update checklist item");
    return res.status(500).json({ error: "Failed to update checklist item" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(checklistItemsTable).where(eq(checklistItemsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete checklist item");
    return res.status(500).json({ error: "Failed to delete checklist item" });
  }
});

export default router;
