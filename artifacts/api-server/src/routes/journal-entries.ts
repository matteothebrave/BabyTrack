import { Router } from "express";
import { db, journalEntriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const entries = await db.select().from(journalEntriesTable).orderBy(desc(journalEntriesTable.entryDate));
    return res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to get journal entries");
    return res.status(500).json({ error: "Failed to get journal entries" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, content, entryDate } = req.body;
    if (!title || !content || !entryDate) {
      return res.status(400).json({ error: "title, content, entryDate are required" });
    }

    const [entry] = await db.insert(journalEntriesTable).values({ title, content, entryDate }).returning();
    return res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to create journal entry");
    return res.status(500).json({ error: "Failed to create journal entry" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, entryDate } = req.body;

    const [updated] = await db
      .update(journalEntriesTable)
      .set({
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(entryDate !== undefined && { entryDate }),
        updatedAt: new Date(),
      })
      .where(eq(journalEntriesTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Entry not found" });
    return res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update journal entry");
    return res.status(500).json({ error: "Failed to update journal entry" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(journalEntriesTable).where(eq(journalEntriesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete journal entry");
    return res.status(500).json({ error: "Failed to delete journal entry" });
  }
});

export default router;
