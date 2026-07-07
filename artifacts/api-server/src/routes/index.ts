import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import settingsRouter from "./settings";
import babiesRouter from "./babies";
import feedingLogsRouter from "./feeding-logs";
import diaperLogsRouter from "./diaper-logs";
import sleepLogsRouter from "./sleep-logs";
import milestonesRouter from "./milestones";
import appointmentsRouter from "./appointments";
import journalEntriesRouter from "./journal-entries";
import contactsRouter from "./contacts";
import contractionsRouter from "./contractions";
import summaryRouter from "./summary";
import { authMiddleware } from "../middlewares/auth-middleware";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use(authMiddleware);
router.use("/settings", settingsRouter);
router.use("/summary", summaryRouter);
router.use("/babies", babiesRouter);
router.use("/feeding-logs", feedingLogsRouter);
router.use("/diaper-logs", diaperLogsRouter);
router.use("/sleep-logs", sleepLogsRouter);
router.use("/milestones", milestonesRouter);
router.use("/appointments", appointmentsRouter);
router.use("/journal-entries", journalEntriesRouter);
router.use("/contacts", contactsRouter);
router.use("/contractions", contractionsRouter);

export default router;
