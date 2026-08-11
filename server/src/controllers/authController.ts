import { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService";
import { generateToken } from "../utils/jwtUtils";
import { setAuthCookie, clearAuthCookie } from "../utils/cookieUtils";
import { AuthenticatedRequest } from "../types/auth";
import { ApiSuccessResponse } from "../types/api";
import { SafeUser } from "../types/user";

export const register = async (
  req: Request,
  res: Response<ApiSuccessResponse<{ user: SafeUser }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.register(req.body);
    const token = generateToken(user.id);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response<ApiSuccessResponse<{ user: SafeUser }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.login(req.body);
    const token = generateToken(user.id);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: Request,
  res: Response<ApiSuccessResponse<{ message: string }>>,
  _next: NextFunction
): Promise<void> => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    data: { message: "Logged out successfully" }
  });
};

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ user: SafeUser }>>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false as any,
        error: { message: "Unauthorized" }
      } as any);
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    next(error);
  }
};
