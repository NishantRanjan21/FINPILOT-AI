import { Router } from "express";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/categoryController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/", listCategories);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
