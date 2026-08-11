import { ErrorRequestHandler } from "express";
import { ApiErrorResponse } from "../types/api";
import { AppError } from "../utils/errors";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  if (statusCode === 500) {
    console.error(error);
  }

  const response: ApiErrorResponse = {
    success: false,
    error: {
      message: error instanceof Error ? error.message : "Internal server error"
    }
  };

  res.status(statusCode).json(response);
};