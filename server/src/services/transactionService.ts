import { transactionModel } from "../models/transactionModel";
import { categoryModel } from "../models/categoryModel";
import {
  SafeTransaction,
  toSafeTransaction,
  TransactionType,
  PaginatedTransactions
} from "../types/transactionTypes";
import { AppError } from "../utils/errors";

const RESTRICTED_FIELDS = new Set([
  "id",
  "userId",
  "user_id",
  "createdAt",
  "created_at",
  "updatedAt",
  "updated_at",
  "targetUserId"
]);

function validateAndParseAmount(input: any): number {
  if (input === undefined || input === null || input === "") {
    throw new AppError("Amount is required", 400);
  }

  if (typeof input !== "number" && typeof input !== "string") {
    throw new AppError("Amount must be a valid numeric value", 400);
  }

  const str = String(input).trim();
  if (str === "" || str.includes("e") || str.includes("E")) {
    throw new AppError("Amount must be a valid numeric value", 400);
  }

  const decimalRegex = /^\d+(\.\d{1,2})?$/;
  if (!decimalRegex.test(str)) {
    throw new AppError(
      "Amount must be a positive number with at most 2 decimal places",
      400
    );
  }

  const num = Number(str);
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    throw new AppError("Amount must be greater than 0", 400);
  }

  if (num > 999999999.99) {
    throw new AppError("Amount exceeds maximum limit (999,999,999.99)", 400);
  }

  return num;
}

function validateAndParseDate(input: any): string {
  if (!input || typeof input !== "string") {
    throw new AppError("Transaction date must be a valid string in YYYY-MM-DD format", 400);
  }

  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    throw new AppError("Transaction date must be a valid date in YYYY-MM-DD format", 400);
  }

  const dateStr = match[0]; // "YYYY-MM-DD"
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    throw new AppError("Transaction date is invalid", 400);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  if (dateStr > todayStr) {
    throw new AppError("Transaction date cannot be in the future", 400);
  }

  return dateStr;
}

function validateDescription(input: any): string | null {
  if (input === undefined || input === null) {
    return null;
  }
  if (typeof input !== "string") {
    throw new AppError("Description must be a string", 400);
  }
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const transactionService = {
  async createTransaction(
    userId: string,
    input: Record<string, any>
  ): Promise<SafeTransaction> {
    for (const key of Object.keys(input)) {
      if (RESTRICTED_FIELDS.has(key)) {
        throw new AppError(`Field '${key}' cannot be specified`, 400);
      }
    }

    const { categoryId, type, amount, description, transactionDate } = input;

    if (!categoryId || typeof categoryId !== "string") {
      throw new AppError("Category ID is required", 400);
    }

    if (!type || typeof type !== "string") {
      throw new AppError("Transaction type is required", 400);
    }

    if (type !== "income" && type !== "expense") {
      throw new AppError("Transaction type must be 'income' or 'expense'", 400);
    }

    const category = await categoryModel.findById(categoryId);
    if (!category || category.user_id !== userId) {
      throw new AppError("Category not found", 404);
    }

    if (category.type !== type) {
      throw new AppError(
        `Category type (${category.type}) does not match transaction type (${type})`,
        422
      );
    }

    const parsedAmount = validateAndParseAmount(amount);
    const parsedDate = validateAndParseDate(transactionDate);
    const parsedDescription = validateDescription(description);

    const transaction = await transactionModel.createTransaction({
      userId,
      categoryId,
      type: type as TransactionType,
      amount: parsedAmount,
      description: parsedDescription,
      transactionDate: parsedDate
    });

    return toSafeTransaction(transaction);
  },

  async getTransactionById(
    userId: string,
    transactionId: string
  ): Promise<SafeTransaction> {
    const transaction = await transactionModel.findById(transactionId, userId);
    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }
    return toSafeTransaction(transaction);
  },

  async getTransactions(
    userId: string,
    filters: Record<string, any>
  ): Promise<PaginatedTransactions> {
    let page = 1;
    if (filters.page !== undefined) {
      const parsedPage = Number(filters.page);
      if (isNaN(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedPage)) {
        throw new AppError("Page must be a positive integer", 400);
      }
      page = parsedPage;
    }

    let limit = 20;
    if (filters.limit !== undefined) {
      const parsedLimit = Number(filters.limit);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100 || !Number.isInteger(parsedLimit)) {
        throw new AppError("Limit must be an integer between 1 and 100", 400);
      }
      limit = parsedLimit;
    }

    let typeFilter: TransactionType | undefined = undefined;
    if (filters.type !== undefined && filters.type !== "") {
      if (filters.type !== "income" && filters.type !== "expense") {
        throw new AppError("Transaction type filter must be 'income' or 'expense'", 400);
      }
      typeFilter = filters.type as TransactionType;
    }

    let sortField: "transaction_date" | "amount" = "transaction_date";
    let sortOrder: "ASC" | "DESC" = "DESC";

    if (filters.sort !== undefined && typeof filters.sort === "string" && filters.sort.trim() !== "") {
      const rawSort = filters.sort.trim().toLowerCase();
      if (rawSort === "date" || rawSort === "transaction_date" || rawSort === "-date" || rawSort === "-transaction_date" || rawSort === "date:desc" || rawSort === "date_desc") {
        sortField = "transaction_date";
        sortOrder = "DESC";
      } else if (rawSort === "+date" || rawSort === "date:asc" || rawSort === "date_asc") {
        sortField = "transaction_date";
        sortOrder = "ASC";
      } else if (rawSort === "amount" || rawSort === "-amount" || rawSort === "amount:desc" || rawSort === "amount_desc") {
        sortField = "amount";
        sortOrder = "DESC";
      } else if (rawSort === "+amount" || rawSort === "amount:asc" || rawSort === "amount_asc") {
        sortField = "amount";
        sortOrder = "ASC";
      } else {
        throw new AppError("Invalid sort parameter. Supported values: date, -date, amount, -amount", 400);
      }
    }

    const offset = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      transactionModel.findMany({
        userId,
        type: typeFilter,
        sortField,
        sortOrder,
        limit,
        offset
      }),
      transactionModel.countMany({
        userId,
        type: typeFilter
      })
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      transactions: transactions.map(toSafeTransaction),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };
  },

  async updateTransaction(
    userId: string,
    transactionId: string,
    input: Record<string, any>
  ): Promise<SafeTransaction> {
    const existing = await transactionModel.findById(transactionId, userId);
    if (!existing) {
      throw new AppError("Transaction not found", 404);
    }

    for (const key of Object.keys(input)) {
      if (RESTRICTED_FIELDS.has(key)) {
        throw new AppError(`Field '${key}' cannot be updated`, 400);
      }
    }

    const updateFields: {
      categoryId?: string;
      type?: TransactionType;
      amount?: number;
      description?: string | null;
      transactionDate?: string;
    } = {};

    let effectiveCategoryId = existing.category_id;
    let effectiveType = existing.type;

    if (input.categoryId !== undefined) {
      if (typeof input.categoryId !== "string" || !input.categoryId) {
        throw new AppError("Category ID must be a valid string", 400);
      }
      effectiveCategoryId = input.categoryId;
      updateFields.categoryId = input.categoryId;
    }

    if (input.type !== undefined) {
      if (input.type !== "income" && input.type !== "expense") {
        throw new AppError("Transaction type must be 'income' or 'expense'", 400);
      }
      effectiveType = input.type as TransactionType;
      updateFields.type = input.type as TransactionType;
    }

    if (input.categoryId !== undefined || input.type !== undefined) {
      const category = await categoryModel.findById(effectiveCategoryId);
      if (!category || category.user_id !== userId) {
        throw new AppError("Category not found", 404);
      }

      if (category.type !== effectiveType) {
        throw new AppError(
          `Category type (${category.type}) does not match transaction type (${effectiveType})`,
          422
        );
      }
    }

    if (input.amount !== undefined) {
      updateFields.amount = validateAndParseAmount(input.amount);
    }

    if (input.transactionDate !== undefined) {
      updateFields.transactionDate = validateAndParseDate(input.transactionDate);
    }

    if (input.description !== undefined) {
      updateFields.description = validateDescription(input.description);
    }

    if (Object.keys(updateFields).length === 0) {
      return toSafeTransaction(existing);
    }

    const updated = await transactionModel.updateTransaction(
      transactionId,
      userId,
      updateFields
    );

    if (!updated) {
      throw new AppError("Failed to update transaction", 500);
    }

    return toSafeTransaction(updated);
  },

  async deleteTransaction(
    userId: string,
    transactionId: string
  ): Promise<void> {
    const existing = await transactionModel.findById(transactionId, userId);
    if (!existing) {
      throw new AppError("Transaction not found", 404);
    }

    await transactionModel.deleteTransaction(transactionId, userId);
  }
};
