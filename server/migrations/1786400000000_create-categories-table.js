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
    CREATE TYPE category_type AS ENUM ('income', 'expense');

    CREATE TABLE categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      name VARCHAR NOT NULL,
      type category_type NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      color VARCHAR,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE UNIQUE INDEX idx_categories_user_name_type ON categories (user_id, LOWER(name), type);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_categories_user_name_type;
    DROP TABLE IF EXISTS categories;
    DROP TYPE IF EXISTS category_type;
  `);
};
