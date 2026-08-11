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
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR NOT NULL,
      email VARCHAR UNIQUE NOT NULL,
      password_hash VARCHAR NOT NULL,
      currency_preference VARCHAR DEFAULT 'USD',
      theme_preference VARCHAR DEFAULT 'light',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP
    );

    CREATE UNIQUE INDEX idx_users_email ON users(email);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_users_email;
    DROP TABLE IF EXISTS users;
  `);
};
