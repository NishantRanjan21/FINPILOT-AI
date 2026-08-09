import { ErrorRequestHandler } from "express";
import { ApiErrorResponse } from "../types/api";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    console.error(error);

    const response: ApiErrorResponse = {
        success: false,
        error: {
            message: error instanceof Error ? error.message : "Internal server error"
        }
    };

    res.status(500).json(response);
}