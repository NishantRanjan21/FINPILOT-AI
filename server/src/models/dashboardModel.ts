import { pool } from "../config/database";
import { TransactionType } from "../types/transactionTypes";

export interface DbFinancialTotals {
  income: string | number;
  expense: string | number;
}

export interface DbRecentTransaction {
  id: string;
  category_id: string;
  category_name: string;
  type: TransactionType;
  amount: string | number;
  description: string | null;
  transaction_date: Date | string;
  created_at: Date;
}

export interface DbCategorySnapshot {
  category_id: string;
  category_name: string;
  type: TransactionType;
  total_amount: string | number;
}

export const dashboardModel = {
  async getFinancialTotals(userId: string): Promise<DbFinancialTotals> {
    const query = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
      FROM transactions
      WHERE user_id = $1
    `;
    const result = await pool.query<DbFinancialTotals>(query, [userId]);
    return result.rows[0] ?? { income: 0, expense: 0 };
  },

  async getRecentTransactions(
    userId: string,
    limit: number = 5
  ): Promise<DbRecentTransaction[]> {
    const query = `
      SELECT
        t.id,
        t.category_id,
        c.name AS category_name,
        t.type,
        t.amount,
        t.description,
        t.transaction_date,
        t.created_at
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = $1
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT $2
    `;
    const result = await pool.query<DbRecentTransaction>(query, [userId, limit]);
    return result.rows;
  },

  async getCategorySnapshot(userId: string): Promise<DbCategorySnapshot[]> {
    const query = `
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        t.type,
        COALESCE(SUM(t.amount), 0) AS total_amount
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = $1
      GROUP BY c.id, c.name, t.type
      ORDER BY total_amount DESC
    `;
    const result = await pool.query<DbCategorySnapshot>(query, [userId]);
    return result.rows;
  }
};
