export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  limit_amount: string | number;
  created_at: Date;
  updated_at: Date | null;
}

export interface DbBudgetWithProgress {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  month: number;
  year: number;
  limit_amount: string | number;
  spent_amount: string | number;
  created_at: Date;
  updated_at: Date | null;
}

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
  createdAt: Date;
  updatedAt: Date | null;
}

export const toSafeBudget = (row: DbBudgetWithProgress): SafeBudget => {
  const limitAmount = Number(Number(row.limit_amount).toFixed(2));
  const spentAmount = Number(Number(row.spent_amount).toFixed(2));
  const remainingAmount = Number((limitAmount - spentAmount).toFixed(2));
  const progressPercentage = Number(((spentAmount / limitAmount) * 100).toFixed(2));

  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    month: Number(row.month),
    year: Number(row.year),
    limitAmount,
    spentAmount,
    remainingAmount,
    progressPercentage,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null
  };
};

export interface CreateBudgetInput {
  categoryId?: string;
  month?: number | string;
  year?: number | string;
  limitAmount?: number | string;
}

export interface UpdateBudgetInput {
  categoryId?: string;
  month?: number | string;
  year?: number | string;
  limitAmount?: number | string;
}

export interface BudgetQueryFilters {
  month?: number | string;
  year?: number | string;
}
