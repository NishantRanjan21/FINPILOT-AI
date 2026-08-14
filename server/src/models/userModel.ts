import { PoolClient } from "pg";
import { pool } from "../config/database";
import { User } from "../types/user";

export const userModel = {
  async createUser(
    params: {
      fullName: string;
      email: string;
      passwordHash: string;
    },
    client?: PoolClient
  ): Promise<User> {
    const executor = client ?? pool;
    const query = `
      INSERT INTO users (full_name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [params.fullName, params.email, params.passwordHash];

    const result = await executor.query<User>(query, values);
    return result.rows[0];
  },

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE email = $1
    `;
    const result = await pool.query<User>(query, [email]);
    return result.rows[0] ?? null;
  },

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE id = $1
    `;
    const result = await pool.query<User>(query, [id]);
    return result.rows[0] ?? null;
  },

  async updateProfile(
    userId: string,
    fields: {
      fullName?: string;
      currencyPreference?: string;
      themePreference?: string;
    }
  ): Promise<User | null> {
    const setClauses: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    if (fields.fullName !== undefined) {
      setClauses.push(`full_name = $${paramIndex++}`);
      values.push(fields.fullName);
    }

    if (fields.currencyPreference !== undefined) {
      setClauses.push(`currency_preference = $${paramIndex++}`);
      values.push(fields.currencyPreference);
    }

    if (fields.themePreference !== undefined) {
      setClauses.push(`theme_preference = $${paramIndex++}`);
      values.push(fields.themePreference);
    }

    if (setClauses.length === 0) {
      return this.findById(userId);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query<User>(query, values);
    return result.rows[0] ?? null;
  },

  async updatePassword(
    userId: string,
    passwordHash: string
  ): Promise<User | null> {
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query<User>(query, [passwordHash, userId]);
    return result.rows[0] ?? null;
  }
};
