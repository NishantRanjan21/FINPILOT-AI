import { PoolClient } from "pg";
import { pool } from "../config/database";
import {
  Category,
  CategoryType,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES
} from "../types/categoryTypes";

export const categoryModel = {
  async seedDefaultCategoriesForUser(
    userId: string,
    client?: PoolClient
  ): Promise<void> {
    const executor = client ?? pool;

    const values: (string | boolean | null)[] = [];
    const valueTuples: string[] = [];
    let paramIndex = 1;

    for (const exp of DEFAULT_EXPENSE_CATEGORIES) {
      valueTuples.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, NULL)`);
      values.push(userId, exp, "expense", true);
    }

    for (const inc of DEFAULT_INCOME_CATEGORIES) {
      valueTuples.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, NULL)`);
      values.push(userId, inc, "income", true);
    }

    const query = `
      INSERT INTO categories (user_id, name, type, is_default, color)
      VALUES ${valueTuples.join(", ")}
      ON CONFLICT (user_id, LOWER(name), type) DO NOTHING
    `;

    await executor.query(query, values);
  },

  async findByUser(userId: string): Promise<Category[]> {
    const query = `
      SELECT * FROM categories
      WHERE user_id = $1
      ORDER BY is_default DESC, name ASC
    `;
    const result = await pool.query<Category>(query, [userId]);
    return result.rows;
  },

  async findById(id: string): Promise<Category | null> {
    const query = `
      SELECT * FROM categories
      WHERE id = $1
    `;
    const result = await pool.query<Category>(query, [id]);
    return result.rows[0] ?? null;
  },

  async findByNameAndType(
    userId: string,
    name: string,
    type: CategoryType
  ): Promise<Category | null> {
    const query = `
      SELECT * FROM categories
      WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND type = $3
    `;
    const result = await pool.query<Category>(query, [userId, name, type]);
    return result.rows[0] ?? null;
  },

  async createCategory(params: {
    userId: string;
    name: string;
    type: CategoryType;
    color?: string | null;
  }): Promise<Category> {
    const query = `
      INSERT INTO categories (user_id, name, type, is_default, color)
      VALUES ($1, $2, $3, FALSE, $4)
      RETURNING *
    `;
    const values = [
      params.userId,
      params.name,
      params.type,
      params.color ?? null
    ];
    const result = await pool.query<Category>(query, values);
    return result.rows[0];
  },

  async updateCategory(
    id: string,
    fields: {
      name?: string;
      color?: string | null;
    }
  ): Promise<Category | null> {
    const setClauses: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    if (fields.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(fields.name);
    }

    if (fields.color !== undefined) {
      setClauses.push(`color = $${paramIndex++}`);
      values.push(fields.color);
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE categories
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query<Category>(query, values);
    return result.rows[0] ?? null;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const query = `
      DELETE FROM categories
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async isCategoryInUse(id: string): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM transactions WHERE category_id = $1
      ) AS in_use
    `;
    const result = await pool.query<{ in_use: boolean }>(query, [id]);
    return result.rows[0]?.in_use === true;
  }
};
