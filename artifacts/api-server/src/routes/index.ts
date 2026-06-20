import { Router, type IRouter } from "express";
import healthRouter from "./health";
import settingsRouter from "./settings";
import babiesRouter from "./babies";
import feedingLogsRouter from "./feeding-logs";
import diaperLogsRouter from "./diaper-logs";
import sleepLogsRouter from "./sleep-logs";
import milestonesRouter from "./milestones";
import checklistItemsRouter from "./checklist-items";
import appointmentsRouter from "./appointments";
import journalEntriesRouter from "./journal-entries";
import summaryRouter from "./summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/settings", settingsRouter);
router.use("/summary", summaryRouter);
router.use("/babies", babiesRouter);
router.use("/feeding-logs", feedingLogsRouter);
router.use("/diaper-logs", diaperLogsRouter);
router.use("/sleep-logs", sleepLogsRouter);
router.use("/milestones", milestonesRouter);
router.use("/checklist-items", checklistItemsRouter);
router.use("/appointments", appointmentsRouter);
router.use("/journal-entries", journalEntriesRouter);

export default router;
