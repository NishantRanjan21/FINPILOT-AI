/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE budgets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      category_id UUID NOT NULL REFERENCES categories(id),
      month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
      year INTEGER NOT NULL,
      limit_amount NUMERIC(12,2) NOT NULL CHECK (limit_amount > 0),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );

    CREATE UNIQUE INDEX idx_budgets_user_category_month_year ON budgets (user_id, category_id, month, year);
    CREATE INDEX idx_budgets_user_month_year ON budgets (user_id, month, year);
    CREATE INDEX idx_budgets_category_id ON budgets (category_id);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_budgets_category_id;
    DROP INDEX IF EXISTS idx_budgets_user_month_year;
    DROP INDEX IF EXISTS idx_budgets_user_category_month_year;
    DROP TABLE IF EXISTS budgets;
  `);
};
