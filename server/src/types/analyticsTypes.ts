import { TransactionType } from "./transactionTypes";

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

export interface MonthlySummaryQuery {
  from?: string;
  to?: string;
}

export interface CategoryBreakdownQuery {
  from?: string;
  to?: string;
}

export interface TrendQuery {
  months?: string | number;
}
