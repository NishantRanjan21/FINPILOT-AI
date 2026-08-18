import { Router } from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
} from "../controllers/transactionController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.get("/:id", getTransactionById);
router.patch("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
