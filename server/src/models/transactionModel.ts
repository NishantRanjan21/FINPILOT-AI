import { pool } from "../config/database";
import { Transaction, TransactionType } from "../types/transactionTypes";

export const transactionModel = {
  async createTransaction(params: {
    userId: string;
    categoryId: string;
    type: TransactionType;
    amount: number;
    description: string | null;
    transactionDate: string;
  }): Promise<Transaction> {
    const query = `
      INSERT INTO transactions (user_id, category_id, type, amount, description, transaction_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      params.userId,
      params.categoryId,
      params.type,
      params.amount,
      params.description,
      params.transactionDate
    ];
    const result = await pool.query<Transaction>(query, values);
    return result.rows[0];
  },

  async findById(id: string, userId: string): Promise<Transaction | null> {
    const query = `
      SELECT * FROM transactions
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query<Transaction>(query, [id, userId]);
    return result.rows[0] ?? null;
  },

  async findMany(params: {
    userId: string;
    type?: TransactionType;
    sortField: "transaction_date" | "amount";
    sortOrder: "ASC" | "DESC";
    limit: number;
    offset: number;
  }): Promise<Transaction[]> {
    const whereClauses = ["user_id = $1"];
    const values: (string | number)[] = [params.userId];
    let paramIndex = 2;

    if (params.type) {
      whereClauses.push(`type = $${paramIndex++}`);
      values.push(params.type);
    }

    let orderByClause: string;
    if (params.sortField === "transaction_date") {
      orderByClause = `transaction_date ${params.sortOrder}, created_at ${params.sortOrder}`;
    } else {
      orderByClause = `amount ${params.sortOrder}, created_at ${params.sortOrder}`;
    }

    values.push(params.limit);
    const limitParamIndex = paramIndex++;

    values.push(params.offset);
    const offsetParamIndex = paramIndex++;

    const query = `
      SELECT * FROM transactions
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY ${orderByClause}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const result = await pool.query<Transaction>(query, values);
    return result.rows;
  },

  async countMany(params: {
    userId: string;
    type?: TransactionType;
  }): Promise<number> {
    const whereClauses = ["user_id = $1"];
    const values: string[] = [params.userId];

    if (params.type) {
      whereClauses.push(`type = $2`);
      values.push(params.type);
    }

    const query = `
      SELECT COUNT(*) AS total FROM transactions
      WHERE ${whereClauses.join(" AND ")}
    `;

    const result = await pool.query<{ total: string }>(query, values);
    return parseInt(result.rows[0]?.total ?? "0", 10);
  },

  async updateTransaction(
    id: string,
    userId: string,
    fields: {
      categoryId?: string;
      type?: TransactionType;
      amount?: number;
      description?: string | null;
      transactionDate?: string;
    }
  ): Promise<Transaction | null> {
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (fields.categoryId !== undefined) {
      setClauses.push(`category_id = $${paramIndex++}`);
      values.push(fields.categoryId);
    }

    if (fields.type !== undefined) {
      setClauses.push(`type = $${paramIndex++}`);
      values.push(fields.type);
    }

    if (fields.amount !== undefined) {
      setClauses.push(`amount = $${paramIndex++}`);
      values.push(fields.amount);
    }

    if (fields.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(fields.description);
    }

    if (fields.transactionDate !== undefined) {
      setClauses.push(`transaction_date = $${paramIndex++}`);
      values.push(fields.transactionDate);
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
      UPDATE transactions
      SET ${setClauses.join(", ")}
      WHERE id = $${idParamIndex} AND user_id = $${userIdParamIndex}
      RETURNING *
    `;

    const result = await pool.query<Transaction>(query, values);
    return result.rows[0] ?? null;
  },

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM transactions
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
};
