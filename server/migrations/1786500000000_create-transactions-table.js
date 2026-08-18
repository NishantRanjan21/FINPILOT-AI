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
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');

    CREATE TABLE transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      category_id UUID NOT NULL REFERENCES categories(id),
      type transaction_type NOT NULL,
      amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
      description TEXT,
      transaction_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );

    CREATE INDEX idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date);
    CREATE INDEX idx_transactions_category_id ON transactions(category_id);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_transactions_category_id;
    DROP INDEX IF EXISTS idx_transactions_user_date;
    DROP INDEX IF EXISTS idx_transactions_user_id;
    DROP TABLE IF EXISTS transactions;
    DROP TYPE IF EXISTS transaction_type;
  `);
};
