import { pool } from "../config/database";
import { Budget, DbBudgetWithProgress } from "../types/budgetTypes";

export const budgetModel = {
  async createBudget(params: {
    userId: string;
    categoryId: string;
    month: number;
    year: number;
    limitAmount: number;
  }): Promise<Budget> {
    const query = `
      INSERT INTO budgets (user_id, category_id, month, year, limit_amount)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      params.userId,
      params.categoryId,
      params.month,
      params.year,
      params.limitAmount
    ];
    const result = await pool.query<Budget>(query, values);
    return result.rows[0];
  },

  async findById(id: string, userId: string): Promise<Budget | null> {
    const query = `
      SELECT * FROM budgets
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query<Budget>(query, [id, userId]);
    return result.rows[0] ?? null;
  },

  async findByUserCategoryMonthYear(
    userId: string,
    categoryId: string,
    month: number,
    year: number
  ): Promise<Budget | null> {
    const query = `
      SELECT * FROM budgets
      WHERE user_id = $1 AND category_id = $2 AND month = $3 AND year = $4
    `;
    const result = await pool.query<Budget>(query, [userId, categoryId, month, year]);
    return result.rows[0] ?? null;
  },

  async findBudgetWithProgressById(
    id: string,
    userId: string
  ): Promise<DbBudgetWithProgress | null> {
    const query = `
      SELECT
        b.id,
        b.user_id,
        b.category_id,
        c.name AS category_name,
        b.month,
        b.year,
        b.limit_amount,
        b.created_at,
        b.updated_at,
        COALESCE(SUM(t.amount), 0) AS spent_amount
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      LEFT JOIN transactions t ON (
        t.user_id = b.user_id
        AND t.category_id = b.category_id
        AND t.type = 'expense'
        AND EXTRACT(YEAR FROM t.transaction_date) = b.year
        AND EXTRACT(MONTH FROM t.transaction_date) = b.month
      )
      WHERE b.id = $1 AND b.user_id = $2
      GROUP BY b.id, b.user_id, b.category_id, c.name, b.month, b.year, b.limit_amount, b.created_at, b.updated_at
    `;
    const result = await pool.query<DbBudgetWithProgress>(query, [id, userId]);
    return result.rows[0] ?? null;
  },

  async findBudgetsWithProgress(params: {
    userId: string;
    month?: number;
    year?: number;
  }): Promise<DbBudgetWithProgress[]> {
    const whereClauses = ["b.user_id = $1"];
    const values: (string | number)[] = [params.userId];
    let paramIndex = 2;

    if (params.year !== undefined) {
      whereClauses.push(`b.year = $${paramIndex++}`);
      values.push(params.year);
    }

    if (params.month !== undefined) {
      whereClauses.push(`b.month = $${paramIndex++}`);
      values.push(params.month);
    }

    const query = `
      SELECT
        b.id,
        b.user_id,
        b.category_id,
        c.name AS category_name,
        b.month,
        b.year,
        b.limit_amount,
        b.created_at,
        b.updated_at,
        COALESCE(SUM(t.amount), 0) AS spent_amount
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      LEFT JOIN transactions t ON (
        t.user_id = b.user_id
        AND t.category_id = b.category_id
        AND t.type = 'expense'
        AND EXTRACT(YEAR FROM t.transaction_date) = b.year
        AND EXTRACT(MONTH FROM t.transaction_date) = b.month
      )
      WHERE ${whereClauses.join(" AND ")}
      GROUP BY b.id, b.user_id, b.category_id, c.name, b.month, b.year, b.limit_amount, b.created_at, b.updated_at
      ORDER BY b.year DESC, b.month DESC, c.name ASC
    `;

    const result = await pool.query<DbBudgetWithProgress>(query, values);
    return result.rows;
  },

  async updateBudget(
    id: string,
    userId: string,
    fields: {
      categoryId?: string;
      month?: number;
      year?: number;
      limitAmount?: number;
    }
  ): Promise<Budget | null> {
    const setClauses: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (fields.categoryId !== undefined) {
      setClauses.push(`category_id = $${paramIndex++}`);
      values.push(fields.categoryId);
    }

    if (fields.month !== undefined) {
      setClauses.push(`month = $${paramIndex++}`);
      values.push(fields.month);
    }

    if (fields.year !== undefined) {
      setClauses.push(`year = $${paramIndex++}`);
      values.push(fields.year);
    }

    if (fields.limitAmount !== undefined) {
      setClauses.push(`limit_amount = $${paramIndex++}`);
      values.push(fields.limitAmount);
    }

    if (setClauses.length === 0) {
      return this.findById(id, userId);
    }

    setClauses.push(`updated_at = NOW()`);

    values.push(id);
    const idParamIndex = paramIndex++;

    values.push(userId);
    const userIdParamIndex = paramIndex++;

    const query = `
      UPDATE budgets
      SET ${setClauses.join(", ")}
      WHERE id = $${idParamIndex} AND user_id = $${userIdParamIndex}
      RETURNING *
    `;

    const result = await pool.query<Budget>(query, values);
    return result.rows[0] ?? null;
  },

  async deleteBudget(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM budgets
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
};
