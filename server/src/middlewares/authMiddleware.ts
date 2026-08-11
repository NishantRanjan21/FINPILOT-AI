import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { AUTH_COOKIE_NAME } from "../utils/cookieUtils";
import { verifyToken } from "../utils/jwtUtils";
import { authService } from "../services/authService";
import { AppError } from "../utils/errors";

export const requireAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new AppError("Invalid or expired authentication token", 401);
    }

    const user = await authService.getCurrentUser(payload.userId);
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
