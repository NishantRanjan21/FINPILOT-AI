import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { dashboardService } from "../services/dashboardService";
import { ApiSuccessResponse } from "../types/api";
import { DashboardSummary } from "../types/dashboardTypes";

export const getDashboardSummary = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<DashboardSummary>>,
  next: NextFunction
): Promise<void> => {
  try {
    const summary = await dashboardService.getSummary(req.user!.id);
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};
