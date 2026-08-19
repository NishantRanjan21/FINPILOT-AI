import { Router } from "express";
import { getDashboardSummary } from "../controllers/dashboardController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/summary", getDashboardSummary);

export default router;
