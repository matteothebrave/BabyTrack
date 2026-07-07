import { Router } from "express";
import { db } from "@workspace/db";
import { contactsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const contacts = await db.select().from(contactsTable).orderBy(contactsTable.name);
    return res.json(contacts);
  } catch (err) {
    req.log.error({ err }, "Failed to get contacts");
    return res.status(500).json({ error: "Failed to get contacts" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, role, phone, email, notes } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: "name and role are required" });
    }
    const [contact] = await db.insert(contactsTable).values({
      name,
      role,
      phone: phone ?? null,
      email: email ?? null,
      notes: notes ?? null,
    }).returning();
    return res.status(201).json(contact);
  } catch (err) {
    req.log.error({ err }, "Failed to create contact");
    return res.status(500).json({ error: "Failed to create contact" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, role, phone, email, notes } = req.body;
    const [contact] = await db.update(contactsTable)
      .set({ name, role, phone: phone ?? null, email: email ?? null, notes: notes ?? null })
      .where(eq(contactsTable.id, id))
      .returning();
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    return res.json(contact);
  } catch (err) {
    req.log.error({ err }, "Failed to update contact");
    return res.status(500).json({ error: "Failed to update contact" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(contactsTable).where(eq(contactsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete contact");
    return res.status(500).json({ error: "Failed to delete contact" });
  }
});

export default router;
