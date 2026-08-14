export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  is_default: boolean;
  color: string | null;
  created_at: Date;
}

export interface SafeCategory {
  id: string;
  name: string;
  type: CategoryType;
  isDefault: boolean;
  color: string | null;
  createdAt: Date;
}

export const toSafeCategory = (category: Category): SafeCategory => {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    isDefault: category.is_default,
    color: category.color,
    createdAt: category.created_at
  };
};

export interface CreateCategoryInput {
  name?: string;
  type?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
}

export const DEFAULT_EXPENSE_CATEGORIES: readonly string[] = [
  "Food",
  "Rent",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills",
  "Healthcare",
  "Education",
  "Other"
];

export const DEFAULT_INCOME_CATEGORIES: readonly string[] = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Other"
];
