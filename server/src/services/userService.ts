import { userModel } from "../models/userModel";
import { SafeUser, toSafeUser } from "../types/user";
import {
  SUPPORTED_CURRENCIES,
  ChangePasswordInput
} from "../types/userTypes";
import { AppError } from "../utils/errors";
import { comparePassword, hashPassword } from "../utils/passwordUtils";

const ALLOWED_PROFILE_FIELDS = new Set([
  "fullName",
  "currencyPreference",
  "themePreference"
]);

export const userService = {
  async getProfile(userId: string): Promise<SafeUser> {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new AppError("User not found or session invalid", 401);
    }
    return toSafeUser(user);
  },

  async updateProfile(
    userId: string,
    input: Record<string, any>
  ): Promise<SafeUser> {
    const currentUser = await userModel.findById(userId);
    if (!currentUser) {
      throw new AppError("User not found or session invalid", 401);
    }

    if ("email" in input) {
      throw new AppError("Email change is not supported", 400);
    }

    for (const key of Object.keys(input)) {
      if (!ALLOWED_PROFILE_FIELDS.has(key)) {
        throw new AppError(`Field '${key}' cannot be updated`, 400);
      }
    }

    const updateFields: {
      fullName?: string;
      currencyPreference?: string;
      themePreference?: string;
    } = {};

    if (input.fullName !== undefined) {
      if (typeof input.fullName !== "string") {
        throw new AppError("Full name must be a string", 400);
      }
      const trimmedName = input.fullName.trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        throw new AppError(
          "Full name must be between 2 and 100 characters long",
          400
        );
      }
      if (trimmedName !== currentUser.full_name) {
        updateFields.fullName = trimmedName;
      }
    }

    if (input.currencyPreference !== undefined) {
      if (
        typeof input.currencyPreference !== "string" ||
        !SUPPORTED_CURRENCIES.includes(input.currencyPreference as any)
      ) {
        throw new AppError("Invalid currency code", 422);
      }
      if (input.currencyPreference !== currentUser.currency_preference) {
        updateFields.currencyPreference = input.currencyPreference;
      }
    }

    if (input.themePreference !== undefined) {
      if (typeof input.themePreference !== "string") {
        throw new AppError("Theme preference must be a string", 400);
      }
      const trimmedTheme = input.themePreference.trim();
      if (trimmedTheme !== currentUser.theme_preference) {
        updateFields.themePreference = trimmedTheme;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return toSafeUser(currentUser);
    }

    const updatedUser = await userModel.updateProfile(userId, updateFields);
    if (!updatedUser) {
      throw new AppError("Failed to update user profile", 500);
    }

    return toSafeUser(updatedUser);
  },

  async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<void> {
    const { currentPassword, newPassword } = input;

    if (!currentPassword || typeof currentPassword !== "string") {
      throw new AppError("Current password is required", 400);
    }

    if (!newPassword || typeof newPassword !== "string") {
      throw new AppError("New password is required", 400);
    }

    const currentUser = await userModel.findById(userId);
    if (!currentUser) {
      throw new AppError("User not found or session invalid", 401);
    }

    const isCurrentValid = await comparePassword(
      currentPassword,
      currentUser.password_hash
    );

    if (!isCurrentValid) {
      throw new AppError("Current password is incorrect", 400);
    }

    if (newPassword.length < 8) {
      throw new AppError(
        "New password must be at least 8 characters long",
        400
      );
    }

    if (!/\d/.test(newPassword)) {
      throw new AppError(
        "New password must contain at least one number",
        400
      );
    }

    const newPasswordHash = await hashPassword(newPassword);
    await userModel.updatePassword(userId, newPasswordHash);
  }
};
