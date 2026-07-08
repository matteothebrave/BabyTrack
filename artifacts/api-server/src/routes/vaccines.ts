import { Router } from "express";
import { db, vaccineRecordsTable, babiesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// Static vaccine schedule: { key, nameEn, ageMonths }
export const VACCINE_SCHEDULE = [
  { key: "bcg", nameEn: "BCG", ageMonths: 0 },
  { key: "hep_b_1", nameEn: "Hepatite B (1ª)", ageMonths: 0 },
  { key: "penta_1", nameEn: "Pentavalente DTP+Hib+HepB (1ª)", ageMonths: 2 },
  { key: "vip_1", nameEn: "Polio VIP (1ª)", ageMonths: 2 },
  { key: "pneumo_1", nameEn: "Pneumocócica 10V (1ª)", ageMonths: 2 },
  { key: "rota_1", nameEn: "Rotavírus (1ª)", ageMonths: 2 },
  { key: "meningo_c1", nameEn: "Meningocócica C (1ª)", ageMonths: 3 },
  { key: "penta_2", nameEn: "Pentavalente DTP+Hib+HepB (2ª)", ageMonths: 4 },
  { key: "vip_2", nameEn: "Polio VIP (2ª)", ageMonths: 4 },
  { key: "pneumo_2", nameEn: "Pneumocócica 10V (2ª)", ageMonths: 4 },
  { key: "rota_2", nameEn: "Rotavírus (2ª)", ageMonths: 4 },
  { key: "meningo_c2", nameEn: "Meningocócica C (2ª)", ageMonths: 5 },
  { key: "penta_3", nameEn: "Pentavalente DTP+Hib+HepB (3ª)", ageMonths: 6 },
  { key: "vip_3", nameEn: "Polio VIP (3ª)", ageMonths: 6 },
  { key: "pneumo_3", nameEn: "Pneumocócica 10V (3ª)", ageMonths: 6 },
  { key: "influenza_1", nameEn: "Influenza (1ª)", ageMonths: 6 },
  { key: "influenza_2", nameEn: "Influenza (2ª)", ageMonths: 7 },
  { key: "yellow_fever", nameEn: "Febre Amarela", ageMonths: 9 },
  { key: "scr_1", nameEn: "SCR — Sarampo+Caxumba+Rubéola (1ª)", ageMonths: 12 },
  { key: "varicela_1", nameEn: "Varicela (1ª)", ageMonths: 12 },
  { key: "pneumo_ref", nameEn: "Pneumocócica 10V (Reforço)", ageMonths: 12 },
  { key: "meningo_c_ref", nameEn: "Meningocócica C (Reforço)", ageMonths: 12 },
  { key: "hep_a", nameEn: "Hepatite A", ageMonths: 15 },
  { key: "dtp_ref1", nameEn: "DTP (1º Reforço)", ageMonths: 15 },
  { key: "vop_ref1", nameEn: "Polio VOP (1º Reforço)", ageMonths: 15 },
  { key: "dtp_ref2", nameEn: "DTP (2º Reforço)", ageMonths: 48 },
  { key: "vop_ref2", nameEn: "Polio VOP (2º Reforço)", ageMonths: 48 },
  { key: "scr_2", nameEn: "SCR (2ª dose)", ageMonths: 48 },
  { key: "varicela_2", nameEn: "Varicela (2ª dose)", ageMonths: 48 },
];

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

router.get("/", async (req, res) => {
  try {
    const babyId = req.query.babyId ? parseInt(req.query.babyId as string) : undefined;
    if (!babyId) return res.status(400).json({ error: "babyId required" });

    const [baby] = await db.select().from(babiesTable).where(eq(babiesTable.id, babyId));
    const records = await db.select().from(vaccineRecordsTable).where(eq(vaccineRecordsTable.babyId, babyId));

    const recordMap = new Map(records.map((r) => [r.vaccineKey, r]));
    const birthDate = baby?.birthDate ? new Date(baby.birthDate) : null;

    const schedule = VACCINE_SCHEDULE.map((v) => {
      const scheduledDate = birthDate ? addMonths(birthDate, v.ageMonths).toISOString().split("T")[0] : null;
      const record = recordMap.get(v.key);
      return {
        key: v.key,
        name: v.nameEn,
        ageMonths: v.ageMonths,
        scheduledDate,
        givenDate: record?.givenDate ?? null,
        recordId: record?.id ?? null,
        notes: record?.notes ?? null,
      };
    });

    return res.json(schedule);
  } catch (err) {
    req.log.error({ err }, "Failed to get vaccines");
    return res.status(500).json({ error: "Failed to get vaccines" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { babyId, vaccineKey, givenDate, notes } = req.body;
    if (!babyId || !vaccineKey || !givenDate) return res.status(400).json({ error: "babyId, vaccineKey, givenDate required" });

    // Upsert: delete existing, insert new
    await db.delete(vaccineRecordsTable).where(
      and(eq(vaccineRecordsTable.babyId, babyId), eq(vaccineRecordsTable.vaccineKey, vaccineKey))
    );
    const [record] = await db.insert(vaccineRecordsTable).values({ babyId, vaccineKey, givenDate, notes: notes ?? null }).returning();
    return res.status(201).json(record);
  } catch (err) {
    req.log.error({ err }, "Failed to record vaccine");
    return res.status(500).json({ error: "Failed to record vaccine" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(vaccineRecordsTable).where(eq(vaccineRecordsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete vaccine record");
    return res.status(500).json({ error: "Failed to delete vaccine record" });
  }
});

export default router;
