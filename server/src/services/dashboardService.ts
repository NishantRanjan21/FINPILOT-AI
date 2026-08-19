import { dashboardModel } from "../models/dashboardModel";
import {
  DashboardSummary,
  RecentTransactionItem,
  CategorySnapshotItem
} from "../types/dashboardTypes";

function formatDate(val: Date | string): string {
  if (val instanceof Date) {
    return val.toISOString().split("T")[0];
  }
  if (typeof val === "string") {
    return val.split("T")[0];
  }
  return String(val);
}

export const dashboardService = {
  async getSummary(userId: string): Promise<DashboardSummary> {
    const [dbTotals, dbRecent, dbCategories] = await Promise.all([
      dashboardModel.getFinancialTotals(userId),
      dashboardModel.getRecentTransactions(userId, 5),
      dashboardModel.getCategorySnapshot(userId)
    ]);

    const income = Number(Number(dbTotals.income || 0).toFixed(2));
    const expense = Number(Number(dbTotals.expense || 0).toFixed(2));
    const balance = Number((income - expense).toFixed(2));

    const recentTransactions: RecentTransactionItem[] = dbRecent.map((item) => ({
      id: item.id,
      categoryId: item.category_id,
      categoryName: item.category_name,
      type: item.type,
      amount: Number(item.amount),
      description: item.description ?? null,
      transactionDate: formatDate(item.transaction_date),
      createdAt: item.created_at
    }));

    const categorySnapshot: CategorySnapshotItem[] = dbCategories.map((item) => ({
      categoryId: item.category_id,
      categoryName: item.category_name,
      type: item.type,
      totalAmount: Number(Number(item.total_amount || 0).toFixed(2))
    }));

    return {
      balance,
      income,
      expense,
      recentTransactions,
      categorySnapshot
    };
  }
};
