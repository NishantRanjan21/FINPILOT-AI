import { budgetModel } from "../models/budgetModel";
import { categoryModel } from "../models/categoryModel";
import {
  SafeBudget,
  toSafeBudget,
  BudgetQueryFilters
} from "../types/budgetTypes";
import { Category } from "../types/categoryTypes";
import { AppError } from "../utils/errors";

const RESTRICTED_FIELDS = new Set([
  "id",
  "userId",
  "user_id",
  "createdAt",
  "created_at",
  "updatedAt",
  "updated_at",
  "spentAmount",
  "spent_amount",
  "remainingAmount",
  "remaining_amount",
  "progressPercentage",
  "progress_percentage"
]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateUUID(id: any, fieldName: string = "ID"): string {
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id.trim())) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
  return id.trim();
}

function validateAndParseLimitAmount(input: any): number {
  if (input === undefined || input === null || input === "") {
    throw new AppError("Limit amount is required", 400);
  }

  if (typeof input !== "number" && typeof input !== "string") {
    throw new AppError("Limit amount must be a valid numeric value", 400);
  }

  const str = String(input).trim();
  if (str === "" || str.includes("e") || str.includes("E")) {
    throw new AppError("Limit amount must be a valid numeric value", 400);
  }

  const decimalRegex = /^\d+(\.\d{1,2})?$/;
  if (!decimalRegex.test(str)) {
    throw new AppError(
      "Limit amount must be a positive number with at most 2 decimal places",
      400
    );
  }

  const num = Number(str);
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    throw new AppError("Limit amount must be greater than 0", 400);
  }

  if (num > 999999999.99) {
    throw new AppError("Limit amount exceeds maximum limit (999,999,999.99)", 400);
  }

  return num;
}

function validateAndParseMonth(input: any): number {
  if (input === undefined || input === null || input === "") {
    throw new AppError("Month is required", 400);
  }

  const str = String(input).trim();
  const num = Number(str);
  if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 12) {
    throw new AppError("Month must be an integer between 1 and 12", 400);
  }

  return num;
}

function validateAndParseYear(input: any): number {
  if (input === undefined || input === null || input === "") {
    throw new AppError("Year is required", 400);
  }

  const str = String(input).trim();
  const num = Number(str);
  if (isNaN(num) || !Number.isInteger(num) || num < 1900 || num > 2100) {
    throw new AppError("Year must be a valid 4-digit integer", 400);
  }

  return num;
}

async function validateExpenseCategory(categoryId: string, userId: string): Promise<Category> {
  const category = await categoryModel.findById(categoryId);
  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (category.user_id !== userId) {
    throw new AppError("Forbidden: Category does not belong to user", 403);
  }

  if (category.type !== "expense") {
    throw new AppError("Budget can only be created for expense categories", 400);
  }

  return category;
}

export const budgetService = {
  async createBudget(
    userId: string,
    input: Record<string, any>
  ): Promise<SafeBudget> {
    for (const key of Object.keys(input)) {
      if (RESTRICTED_FIELDS.has(key)) {
        throw new AppError(`Field '${key}' cannot be specified`, 400);
      }
    }

    const { categoryId, month, year, limitAmount } = input;

    const validatedCategoryId = validateUUID(categoryId, "Category ID");
    await validateExpenseCategory(validatedCategoryId, userId);

    const parsedMonth = validateAndParseMonth(month);
    const parsedYear = validateAndParseYear(year);
    const parsedLimitAmount = validateAndParseLimitAmount(limitAmount);

    const existing = await budgetModel.findByUserCategoryMonthYear(
      userId,
      validatedCategoryId,
      parsedMonth,
      parsedYear
    );

    if (existing) {
      throw new AppError(
        "A budget for this category, month, and year already exists",
        409
      );
    }

    try {
      const budget = await budgetModel.createBudget({
        userId,
        categoryId: validatedCategoryId,
        month: parsedMonth,
        year: parsedYear,
        limitAmount: parsedLimitAmount
      });

      const budgetWithProgress = await budgetModel.findBudgetWithProgressById(
        budget.id,
        userId
      );

      if (!budgetWithProgress) {
        throw new AppError("Failed to load created budget", 500);
      }

      return toSafeBudget(budgetWithProgress);
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new AppError(
          "A budget for this category, month, and year already exists",
          409
        );
      }
      throw error;
    }
  },

  async getBudgets(
    userId: string,
    filters: BudgetQueryFilters
  ): Promise<SafeBudget[]> {
    let monthFilter: number | undefined = undefined;
    let yearFilter: number | undefined = undefined;

    if (filters.year !== undefined && String(filters.year).trim() !== "") {
      yearFilter = validateAndParseYear(filters.year);
    }

    if (filters.month !== undefined && String(filters.month).trim() !== "") {
      monthFilter = validateAndParseMonth(filters.month);

      if (yearFilter === undefined) {
        throw new AppError("Year is required when filtering by month", 400);
      }
    }

    const budgets = await budgetModel.findBudgetsWithProgress({
      userId,
      month: monthFilter,
      year: yearFilter
    });

    return budgets.map(toSafeBudget);
  },

  async updateBudget(
    userId: string,
    budgetId: string,
    input: Record<string, any>
  ): Promise<SafeBudget> {
    const validBudgetId = validateUUID(budgetId, "Budget ID");

    const existing = await budgetModel.findById(validBudgetId, userId);
    if (!existing) {
      throw new AppError("Budget not found", 404);
    }

    for (const key of Object.keys(input)) {
      if (RESTRICTED_FIELDS.has(key)) {
        throw new AppError(`Field '${key}' cannot be updated`, 400);
      }
    }

    const updateFields: {
      categoryId?: string;
      month?: number;
      year?: number;
      limitAmount?: number;
    } = {};

    let effectiveCategoryId = existing.category_id;
    let effectiveMonth = Number(existing.month);
    let effectiveYear = Number(existing.year);

    if (input.categoryId !== undefined) {
      const validCategoryId = validateUUID(input.categoryId, "Category ID");
      await validateExpenseCategory(validCategoryId, userId);
      effectiveCategoryId = validCategoryId;
      updateFields.categoryId = validCategoryId;
    }

    if (input.month !== undefined) {
      const parsedMonth = validateAndParseMonth(input.month);
      effectiveMonth = parsedMonth;
      updateFields.month = parsedMonth;
    }

    if (input.year !== undefined) {
      const parsedYear = validateAndParseYear(input.year);
      effectiveYear = parsedYear;
      updateFields.year = parsedYear;
    }

    if (input.limitAmount !== undefined) {
      updateFields.limitAmount = validateAndParseLimitAmount(input.limitAmount);
    }

    if (
      input.categoryId !== undefined ||
      input.month !== undefined ||
      input.year !== undefined
    ) {
      const duplicate = await budgetModel.findByUserCategoryMonthYear(
        userId,
        effectiveCategoryId,
        effectiveMonth,
        effectiveYear
      );

      if (duplicate && duplicate.id !== validBudgetId) {
        throw new AppError(
          "A budget for this category, month, and year already exists",
          409
        );
      }
    }

    if (Object.keys(updateFields).length === 0) {
      const current = await budgetModel.findBudgetWithProgressById(
        validBudgetId,
        userId
      );
      if (!current) {
        throw new AppError("Budget not found", 404);
      }
      return toSafeBudget(current);
    }

    try {
      const updated = await budgetModel.updateBudget(
        validBudgetId,
        userId,
        updateFields
      );

      if (!updated) {
        throw new AppError("Failed to update budget", 500);
      }

      const budgetWithProgress = await budgetModel.findBudgetWithProgressById(
        validBudgetId,
        userId
      );

      if (!budgetWithProgress) {
        throw new AppError("Failed to load updated budget", 500);
      }

      return toSafeBudget(budgetWithProgress);
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new AppError(
          "A budget for this category, month, and year already exists",
          409
        );
      }
      throw error;
    }
  },

  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    const validBudgetId = validateUUID(budgetId, "Budget ID");

    const existing = await budgetModel.findById(validBudgetId, userId);
    if (!existing) {
      throw new AppError("Budget not found", 404);
    }

    await budgetModel.deleteBudget(validBudgetId, userId);
  }
};
