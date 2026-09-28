import { pool } from "../config/database";
import { TransactionType } from "../types/transactionTypes";

export interface DbMonthlySummaryRow {
  month: string;
  income: string | number;
  expense: string | number;
}

export interface DbCategoryBreakdownRow {
  category_id: string;
  category_name: string;
  type: TransactionType;
  total_amount: string | number;
}

export interface DbTrendRow {
  month: string;
  income: string | number;
  expense: string | number;
  net: string | number;
}

export const analyticsModel = {
  async getMonthlySummary(
    userId: string,
    from?: string,
    to?: string
  ): Promise<DbMonthlySummaryRow[]> {
    const whereClauses = ["user_id = $1"];
    const values: (string | number)[] = [userId];
    let paramIndex = 2;

    if (from) {
      whereClauses.push(`transaction_date >= $${paramIndex++}`);
      values.push(from);
    }
    if (to) {
      whereClauses.push(`transaction_date <= $${paramIndex++}`);
      values.push(to);
    }

    const query = `
      SELECT
        TO_CHAR(transaction_date, 'YYYY-MM') AS month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
      FROM transactions
      WHERE ${whereClauses.join(" AND ")}
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
      ORDER BY month ASC
    `;

    const result = await pool.query<DbMonthlySummaryRow>(query, values);
    return result.rows;
  },

  async getCategoryBreakdown(
    userId: string,
    from?: string,
    to?: string
  ): Promise<DbCategoryBreakdownRow[]> {
    const whereClauses = ["t.user_id = $1"];
    const values: (string | number)[] = [userId];
    let paramIndex = 2;

    if (from) {
      whereClauses.push(`t.transaction_date >= $${paramIndex++}`);
      values.push(from);
    }
    if (to) {
      whereClauses.push(`t.transaction_date <= $${paramIndex++}`);
      values.push(to);
    }

    const query = `
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        t.type,
        COALESCE(SUM(t.amount), 0) AS total_amount
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE ${whereClauses.join(" AND ")}
      GROUP BY c.id, c.name, t.type
      ORDER BY total_amount DESC, c.name ASC
    `;

    const result = await pool.query<DbCategoryBreakdownRow>(query, values);
    return result.rows;
  },

  async getTrend(
    userId: string,
    months: number
  ): Promise<DbTrendRow[]> {
    const query = `
      WITH months_series AS (
        SELECT TO_CHAR(
          generate_series(
            DATE_TRUNC('month', CURRENT_DATE) - (($2::integer - 1) * INTERVAL '1 month'),
            DATE_TRUNC('month', CURRENT_DATE),
            INTERVAL '1 month'
          ),
          'YYYY-MM'
        ) AS month
      ),
      monthly_data AS (
        SELECT
          TO_CHAR(transaction_date, 'YYYY-MM') AS month,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
        FROM transactions
        WHERE user_id = $1
          AND transaction_date >= (DATE_TRUNC('month', CURRENT_DATE) - (($2::integer - 1) * INTERVAL '1 month'))::DATE
          AND transaction_date < (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE
        GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
      )
      SELECT
        m.month,
        COALESCE(d.income, 0) AS income,
        COALESCE(d.expense, 0) AS expense,
        COALESCE(d.income, 0) - COALESCE(d.expense, 0) AS net
      FROM months_series m
      LEFT JOIN monthly_data d ON m.month = d.month
      ORDER BY m.month ASC
    `;

    const result = await pool.query<DbTrendRow>(query, [userId, months]);
    return result.rows;
  }
};
