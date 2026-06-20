import { Router } from "express";
import { db, settingsTable, babiesTable, feedingLogsTable, diaperLogsTable, checklistItemsTable, appointmentsTable } from "@workspace/db";
import { and, gte, lte, sql, gte as gteOp } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const settings = await db.select().from(settingsTable).limit(1);
    const babies = await db.select().from(babiesTable);

    let daysUntilDue: number | null = null;
    let dueDate: string | null = null;

    if (settings[0]?.dueDate) {
      dueDate = settings[0].dueDate;
      const due = new Date(settings[0].dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const feedingsToday = await db.select({ count: sql<number>`count(*)::int` })
      .from(feedingLogsTable)
      .where(and(gte(feedingLogsTable.loggedAt, todayStart), lte(feedingLogsTable.loggedAt, todayEnd)));

    const diapersToday = await db.select({ count: sql<number>`count(*)::int` })
      .from(diaperLogsTable)
      .where(and(gte(diaperLogsTable.loggedAt, todayStart), lte(diaperLogsTable.loggedAt, todayEnd)));

    const allChecklist = await db.select({ completed: checklistItemsTable.completed }).from(checklistItemsTable);
    const checklistTotal = allChecklist.length;
    const checklistCompleted = allChecklist.filter(i => i.completed).length;

    const now = new Date().toISOString().split("T")[0];
    const upcoming = await db.select().from(appointmentsTable)
      .where(gteOp(appointmentsTable.appointmentDate, now))
      .orderBy(appointmentsTable.appointmentDate)
      .limit(3);

    return res.json({
      daysUntilDue,
      dueDate,
      babiesCount: babies.length,
      totalFeedingsToday: feedingsToday[0]?.count ?? 0,
      totalDiapersToday: diapersToday[0]?.count ?? 0,
      checklistProgress: { total: checklistTotal, completed: checklistCompleted },
      upcomingAppointments: upcoming,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    return res.status(500).json({ error: "Failed to get dashboard summary" });
  }
});

export default router;
