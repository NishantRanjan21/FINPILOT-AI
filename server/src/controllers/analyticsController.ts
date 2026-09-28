import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { analyticsService } from "../services/analyticsService";
import { ApiSuccessResponse } from "../types/api";
import {
  MonthlySummaryItem,
  CategoryBreakdownItem,
  TrendItem
} from "../types/analyticsTypes";

export const getMonthlySummary = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<MonthlySummaryItem[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const summary = await analyticsService.getMonthlySummary(
      req.user!.id,
      req.query
    );
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBreakdown = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<CategoryBreakdownItem[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const breakdown = await analyticsService.getCategoryBreakdown(
      req.user!.id,
      req.query
    );
    res.status(200).json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    next(error);
  }
};

export const getTrend = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<TrendItem[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const trend = await analyticsService.getTrend(
      req.user!.id,
      req.query
    );
    res.status(200).json({
      success: true,
      data: trend
    });
  } catch (error) {
    next(error);
  }
};
