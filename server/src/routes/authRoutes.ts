import { Router } from "express";
import {
  register,
  login,
  logout,
  getCurrentUser
} from "../controllers/authController";
import { requireAuth } from "../middlewares/authMiddleware";
import { authRateLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/logout", logout);
router.get("/me", requireAuth, getCurrentUser);

export default router;
