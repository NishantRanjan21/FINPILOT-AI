import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { categoryService } from "../services/categoryService";
import { ApiSuccessResponse } from "../types/api";
import { SafeCategory } from "../types/categoryTypes";

export const listCategories = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ categories: SafeCategory[] }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await categoryService.getCategories(req.user!.id);
    res.status(200).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ category: SafeCategory }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const category = await categoryService.createCategory(
      req.user!.id,
      req.body
    );
    res.status(201).json({
      success: true,
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ category: SafeCategory }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const categoryId = String(req.params.id);
    const category = await categoryService.updateCategory(
      req.user!.id,
      categoryId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ message: string }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const categoryId = String(req.params.id);
    await categoryService.deleteCategory(req.user!.id, categoryId);
    res.status(200).json({
      success: true,
      data: { message: "Category deleted successfully" }
    });
  } catch (error) {
    next(error);
  }
};
