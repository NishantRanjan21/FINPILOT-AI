import { TransactionType } from "./transactionTypes";

export interface RecentTransactionItem {
  id: string;
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  transactionDate: string;
  createdAt: Date;
}

export interface CategorySnapshotItem {
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  totalAmount: number;
}

export interface DashboardSummary {
  balance: number;
  income: number;
  expense: number;
  recentTransactions: RecentTransactionItem[];
  categorySnapshot: CategorySnapshotItem[];
}
