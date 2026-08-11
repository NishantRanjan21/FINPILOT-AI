import dotenv from "dotenv";

dotenv.config();

const requiredEnvVariables = [
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_NAME",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
  "JWT_SECRET",
  "GEMINI_API_KEY",
  "FRONTEND_URL"
] as const;

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]?.trim()) {
    throw new Error(
      `Missing required environment variable: ${variable}`
    );
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),

  database: {
    host: process.env.DATABASE_HOST!,
    port: Number(process.env.DATABASE_PORT),
    name: process.env.DATABASE_NAME!,
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!
  },

  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  geminiApiKey: process.env.GEMINI_API_KEY!,
  frontendUrl: process.env.FRONTEND_URL!
};