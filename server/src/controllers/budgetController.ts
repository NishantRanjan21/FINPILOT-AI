import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { budgetService } from "../services/budgetService";
import { ApiSuccessResponse } from "../types/api";
import { SafeBudget } from "../types/budgetTypes";

export const createBudget = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ budget: SafeBudget }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const budget = await budgetService.createBudget(
      req.user!.id,
      req.body
    );
    res.status(201).json({
      success: true,
      data: { budget }
    });
  } catch (error) {
    next(error);
  }
};

export const getBudgets = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ budgets: SafeBudget[] }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const budgets = await budgetService.getBudgets(
      req.user!.id,
      req.query
    );
    res.status(200).json({
      success: true,
      data: { budgets }
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ budget: SafeBudget }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const budgetId = String(req.params.id);
    const budget = await budgetService.updateBudget(
      req.user!.id,
      budgetId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: { budget }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ message: string }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const budgetId = String(req.params.id);
    await budgetService.deleteBudget(
      req.user!.id,
      budgetId
    );
    res.status(200).json({
      success: true,
      data: { message: "Budget deleted successfully" }
    });
  } catch (error) {
    next(error);
  }
};
