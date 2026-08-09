import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

export const checkDatabaseConnection = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
};