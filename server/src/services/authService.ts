import { pool } from "../config/database";
import { userModel } from "../models/userModel";
import { categoryModel } from "../models/categoryModel";
import { RegisterInput, LoginInput } from "../types/auth";
import { SafeUser, toSafeUser } from "../types/user";
import { AppError } from "../utils/errors";
import { hashPassword, comparePassword } from "../utils/passwordUtils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authService = {
  async register(input: RegisterInput): Promise<SafeUser> {
    const fullName = input.fullName?.trim();
    const rawEmail = input.email?.trim();
    const password = input.password;

    if (!fullName) {
      throw new AppError("Full name is required", 400);
    }

    if (!rawEmail) {
      throw new AppError("Email is required", 400);
    }

    if (!EMAIL_REGEX.test(rawEmail)) {
      throw new AppError("Invalid email format", 400);
    }

    if (!password) {
      throw new AppError("Password is required", 400);
    }

    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters long", 400);
    }

    if (!/\d/.test(password)) {
      throw new AppError("Password must contain at least one number", 400);
    }

    const email = rawEmail.toLowerCase();

    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      throw new AppError("Email is already registered", 409);
    }

    const passwordHash = await hashPassword(password);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const user = await userModel.createUser(
        {
          fullName,
          email,
          passwordHash
        },
        client
      );

      await categoryModel.seedDefaultCategoriesForUser(user.id, client);

      await client.query("COMMIT");
      return toSafeUser(user);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async login(input: LoginInput): Promise<SafeUser> {
    const rawEmail = input.email?.trim();
    const password = input.password;

    if (!rawEmail) {
      throw new AppError("Email is required", 400);
    }

    if (!EMAIL_REGEX.test(rawEmail)) {
      throw new AppError("Invalid email format", 400);
    }

    if (!password) {
      throw new AppError("Password is required", 400);
    }

    const email = rawEmail.toLowerCase();

    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    return toSafeUser(user);
  },

  async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new AppError("User not found or session invalid", 401);
    }

    return toSafeUser(user);
  }
};
