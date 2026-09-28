// ─── API Types ───────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: { message: string };
}

// ─── User ────────────────────────────────────────────────────

export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  currencyPreference: string;
  themePreference: string;
  createdAt: string;
  updatedAt: string | null;
}

// ─── Category ────────────────────────────────────────────────

export type CategoryType = "income" | "expense";

export interface SafeCategory {
  id: string;
  name: string;
  type: CategoryType;
  isDefault: boolean;
  color: string | null;
  createdAt: string;
}

// ─── Transaction ─────────────────────────────────────────────

export type TransactionType = "income" | "expense";

export interface SafeTransaction {
  id: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  transactionDate: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedTransactions {
  transactions: SafeTransaction[];
  pagination: PaginationMetadata;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  sort?: string;
  type?: TransactionType | "";
  search?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: string;
  max_amount?: string;
}

// ─── Dashboard ───────────────────────────────────────────────

export interface RecentTransactionItem {
  id: string;
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  transactionDate: string;
  createdAt: string;
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

// ─── Budget ──────────────────────────────────────────────────

export interface SafeBudget {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  month: number;
  year: number;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string | null;
}

// ─── Analytics ───────────────────────────────────────────────

export interface MonthlySummaryItem {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  totalAmount: number;
}

export interface TrendItem {
  month: string;
  income: number;
  expense: number;
  net: number;
}
