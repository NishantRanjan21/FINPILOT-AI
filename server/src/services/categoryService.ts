import { categoryModel } from "../models/categoryModel";
import { SafeCategory, toSafeCategory, CategoryType } from "../types/categoryTypes";
import { AppError } from "../utils/errors";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const RESTRICTED_CREATE_FIELDS = new Set([
  "id",
  "user_id",
  "userId",
  "is_default",
  "isDefault",
  "created_at",
  "createdAt"
]);

const RESTRICTED_UPDATE_FIELDS = new Set([
  "id",
  "user_id",
  "userId",
  "type",
  "is_default",
  "isDefault",
  "created_at",
  "createdAt"
]);

export const categoryService = {
  async getCategories(userId: string): Promise<SafeCategory[]> {
    const categories = await categoryModel.findByUser(userId);
    return categories.map(toSafeCategory);
  },

  async createCategory(
    userId: string,
    input: Record<string, any>
  ): Promise<SafeCategory> {
    for (const key of Object.keys(input)) {
      if (RESTRICTED_CREATE_FIELDS.has(key)) {
        throw new AppError(`Field '${key}' cannot be specified`, 400);
      }
    }

    const { name, type, color } = input;

    if (!name || typeof name !== "string") {
      throw new AppError("Category name is required", 400);
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      throw new AppError(
        "Category name must be between 1 and 100 characters long",
        400
      );
    }

    if (!type || typeof type !== "string") {
      throw new AppError("Category type is required", 400);
    }

    if (type !== "income" && type !== "expense") {
      throw new AppError("Category type must be 'income' or 'expense'", 400);
    }

    let validColor: string | null = null;
    if (color !== undefined && color !== null) {
      if (typeof color !== "string" || !HEX_COLOR_REGEX.test(color)) {
        throw new AppError(
          "Color must be a valid 6-digit hex code (e.g. #1a2b3c)",
          400
        );
      }
      validColor = color;
    }

    const existing = await categoryModel.findByNameAndType(
      userId,
      trimmedName,
      type as CategoryType
    );

    if (existing) {
      throw new AppError(
        "A category with this name and type already exists",
        409
      );
    }

    const category = await categoryModel.createCategory({
      userId,
      name: trimmedName,
      type: type as CategoryType,
      color: validColor
    });

    return toSafeCategory(category);
  },

  async updateCategory(
    userId: string,
    categoryId: string,
    input: Record<string, any>
  ): Promise<SafeCategory> {
    const category = await categoryModel.findById(categoryId);
    if (!category || category.user_id !== userId) {
      throw new AppError("Category not found", 404);
    }

    if (category.is_default) {
      throw new AppError("Default categories cannot be edited", 403);
    }

    for (const key of Object.keys(input)) {
      if (RESTRICTED_UPDATE_FIELDS.has(key)) {
        throw new AppError(`Field '${key}' cannot be updated`, 400);
      }
    }

    const updateFields: { name?: string; color?: string | null } = {};

    if (input.name !== undefined) {
      if (typeof input.name !== "string") {
        throw new AppError("Category name must be a string", 400);
      }
      const trimmedName = input.name.trim();
      if (trimmedName.length < 1 || trimmedName.length > 100) {
        throw new AppError(
          "Category name must be between 1 and 100 characters long",
          400
        );
      }

      if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
        const existing = await categoryModel.findByNameAndType(
          userId,
          trimmedName,
          category.type
        );
        if (existing) {
          throw new AppError(
            "A category with this name and type already exists",
            409
          );
        }
      }
      updateFields.name = trimmedName;
    }

    if (input.color !== undefined) {
      if (input.color === null) {
        updateFields.color = null;
      } else if (
        typeof input.color !== "string" ||
        !HEX_COLOR_REGEX.test(input.color)
      ) {
        throw new AppError(
          "Color must be a valid 6-digit hex code (e.g. #1a2b3c)",
          400
        );
      } else {
        updateFields.color = input.color;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return toSafeCategory(category);
    }

    const updated = await categoryModel.updateCategory(
      categoryId,
      updateFields
    );

    if (!updated) {
      throw new AppError("Failed to update category", 500);
    }

    return toSafeCategory(updated);
  },

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const category = await categoryModel.findById(categoryId);
    if (!category || category.user_id !== userId) {
      throw new AppError("Category not found", 404);
    }

    if (category.is_default) {
      throw new AppError("Default categories cannot be deleted", 403);
    }

    const inUse = await categoryModel.isCategoryInUse(categoryId);
    if (inUse) {
      throw new AppError(
        "Category cannot be deleted because it is linked to transactions",
        409
      );
    }

    await categoryModel.deleteCategory(categoryId);
  }
};
