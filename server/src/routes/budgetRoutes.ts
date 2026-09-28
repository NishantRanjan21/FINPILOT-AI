import { Router } from "express";
import {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget
} from "../controllers/budgetController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth);

router.post("/", createBudget);
router.get("/", getBudgets);
router.patch("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
