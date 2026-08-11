import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword
} from "../controllers/userController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/password", changePassword);

export default router;
