import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { userService } from "../services/userService";
import { ApiSuccessResponse } from "../types/api";
import { SafeUser } from "../types/user";

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ user: SafeUser }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.getProfile(req.user!.id);
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ user: SafeUser }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.updateProfile(req.user!.id, req.body);
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ message: string }>>,
  next: NextFunction
): Promise<void> => {
  try {
    await userService.changePassword(req.user!.id, req.body);
    res.status(200).json({
      success: true,
      data: { message: "Password updated successfully" }
    });
  } catch (error) {
    next(error);
  }
};
