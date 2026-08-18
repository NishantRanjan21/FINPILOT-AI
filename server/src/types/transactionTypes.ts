export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  type: TransactionType;
  amount: string | number;
  description: string | null;
  transaction_date: Date | string;
  created_at: Date;
  updated_at: Date | null;
}

export interface SafeTransaction {
  id: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  transactionDate: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export const toSafeTransaction = (transaction: Transaction): SafeTransaction => {
  let formattedDate: string;
  if (transaction.transaction_date instanceof Date) {
    formattedDate = transaction.transaction_date.toISOString().split("T")[0];
  } else if (typeof transaction.transaction_date === "string") {
    formattedDate = transaction.transaction_date.split("T")[0];
  } else {
    formattedDate = String(transaction.transaction_date);
  }

  return {
    id: transaction.id,
    userId: transaction.user_id,
    categoryId: transaction.category_id,
    type: transaction.type,
    amount: Number(transaction.amount),
    description: transaction.description ?? null,
    transactionDate: formattedDate,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at ?? null
  };
};

export interface CreateTransactionInput {
  categoryId?: string;
  type?: string;
  amount?: number | string;
  description?: string | null;
  transactionDate?: string;
}

export interface UpdateTransactionInput {
  categoryId?: string;
  type?: string;
  amount?: number | string;
  description?: string | null;
  transactionDate?: string;
}

export interface TransactionQueryFilters {
  page?: number;
  limit?: number;
  sort?: string;
  type?: TransactionType;
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
