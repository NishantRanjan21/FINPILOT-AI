import { analyticsModel } from "../models/analyticsModel";
import {
  MonthlySummaryItem,
  CategoryBreakdownItem,
  TrendItem,
  MonthlySummaryQuery,
  CategoryBreakdownQuery,
  TrendQuery
} from "../types/analyticsTypes";
import { AppError } from "../utils/errors";

const MAX_DATE_RANGE_DAYS = 5 * 366; // 5 years max range

export function isValidDateString(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return false;
  }
  const [y, m, d] = str.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

function parseAndValidateDate(val: any, paramName: string): string {
  if (typeof val !== "string") {
    throw new AppError(`'${paramName}' must be a valid date in YYYY-MM-DD format`, 400);
  }
  const trimmed = val.trim();
  if (!isValidDateString(trimmed)) {
    throw new AppError(`'${paramName}' must be a valid date in YYYY-MM-DD format`, 400);
  }
  return trimmed;
}

function validateDateRange(
  rawFrom?: any,
  rawTo?: any
): { from?: string; to?: string } {
  let from: string | undefined = undefined;
  let to: string | undefined = undefined;

  if (rawFrom !== undefined && rawFrom !== null && String(rawFrom).trim() !== "") {
    from = parseAndValidateDate(rawFrom, "from");
  }

  if (rawTo !== undefined && rawTo !== null && String(rawTo).trim() !== "") {
    to = parseAndValidateDate(rawTo, "to");
  }

  if (from && to) {
    if (from > to) {
      throw new AppError("'from' date cannot be after 'to' date", 400);
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffDays = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays > MAX_DATE_RANGE_DAYS) {
      throw new AppError("Date range cannot exceed 5 years", 400);
    }
  }

  return { from, to };
}

export const analyticsService = {
  async getMonthlySummary(
    userId: string,
    query: MonthlySummaryQuery
  ): Promise<MonthlySummaryItem[]> {
    const { from, to } = validateDateRange(query.from, query.to);
    const rows = await analyticsModel.getMonthlySummary(userId, from, to);

    return rows.map((row) => ({
      month: row.month,
      income: Number(Number(row.income || 0).toFixed(2)),
      expense: Number(Number(row.expense || 0).toFixed(2))
    }));
  },

  async getCategoryBreakdown(
    userId: string,
    query: CategoryBreakdownQuery
  ): Promise<CategoryBreakdownItem[]> {
    const { from, to } = validateDateRange(query.from, query.to);
    const rows = await analyticsModel.getCategoryBreakdown(userId, from, to);

    return rows.map((row) => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      type: row.type,
      totalAmount: Number(Number(row.total_amount || 0).toFixed(2))
    }));
  },

  async getTrend(
    userId: string,
    query: TrendQuery
  ): Promise<TrendItem[]> {
    let months = 6;
    if (query.months !== undefined && query.months !== null && String(query.months).trim() !== "") {
      const parsedMonths = Number(query.months);
      if (
        isNaN(parsedMonths) ||
        !Number.isInteger(parsedMonths) ||
        parsedMonths < 1 ||
        parsedMonths > 60
      ) {
        throw new AppError("Months parameter must be an integer between 1 and 60", 400);
      }
      months = parsedMonths;
    }

    const rows = await analyticsModel.getTrend(userId, months);

    return rows.map((row) => ({
      month: row.month,
      income: Number(Number(row.income || 0).toFixed(2)),
      expense: Number(Number(row.expense || 0).toFixed(2)),
      net: Number(Number(row.net || 0).toFixed(2))
    }));
  }
};
