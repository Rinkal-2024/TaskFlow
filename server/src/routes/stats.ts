import { Router } from "express";
import {
  getOverviewStats,
  getTaskAnalytics,
  getTeamPerformance,
  getSystemHealth,
  getUserStats,
} from "../controllers/stats";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/overview", getOverviewStats);

router.get("/analytics", getTaskAnalytics);

router.get("/user", getUserStats);

router.get("/team", requireAdmin, getTeamPerformance);
router.get("/system", requireAdmin, getSystemHealth);

export default router;
