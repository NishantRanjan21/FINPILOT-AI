import { Router } from "express";
import {
  getMonthlySummary,
  getCategoryBreakdown,
  getTrend
} from "../controllers/analyticsController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/monthly-summary", getMonthlySummary);
router.get("/category-breakdown", getCategoryBreakdown);
router.get("/trend", getTrend);

export default router;
