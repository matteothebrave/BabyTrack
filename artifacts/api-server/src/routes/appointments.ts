import { Router } from "express";
import { db, appointmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const appointments = await db.select().from(appointmentsTable).orderBy(appointmentsTable.appointmentDate);
    return res.json(appointments);
  } catch (err) {
    req.log.error({ err }, "Failed to get appointments");
    return res.status(500).json({ error: "Failed to get appointments" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, appointmentDate, location, notes } = req.body;
    if (!title || !appointmentDate) {
      return res.status(400).json({ error: "title, appointmentDate are required" });
    }

    const [appt] = await db.insert(appointmentsTable).values({
      title,
      appointmentDate,
      location: location ?? null,
      notes: notes ?? null,
    }).returning();

    return res.status(201).json(appt);
  } catch (err) {
    req.log.error({ err }, "Failed to create appointment");
    return res.status(500).json({ error: "Failed to create appointment" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete appointment");
    return res.status(500).json({ error: "Failed to delete appointment" });
  }
});

export default router;
