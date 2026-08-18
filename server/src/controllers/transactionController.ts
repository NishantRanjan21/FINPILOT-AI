import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { transactionService } from "../services/transactionService";
import { ApiSuccessResponse } from "../types/api";
import { SafeTransaction, PaginatedTransactions } from "../types/transactionTypes";

export const createTransaction = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ transaction: SafeTransaction }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const transaction = await transactionService.createTransaction(
      req.user!.id,
      req.body
    );
    res.status(201).json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<PaginatedTransactions>>,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await transactionService.getTransactions(
      req.user!.id,
      req.query
    );
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ transaction: SafeTransaction }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const transactionId = String(req.params.id);
    const transaction = await transactionService.getTransactionById(
      req.user!.id,
      transactionId
    );
    res.status(200).json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ transaction: SafeTransaction }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const transactionId = String(req.params.id);
    const transaction = await transactionService.updateTransaction(
      req.user!.id,
      transactionId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (
  req: AuthenticatedRequest,
  res: Response<ApiSuccessResponse<{ message: string }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const transactionId = String(req.params.id);
    await transactionService.deleteTransaction(
      req.user!.id,
      transactionId
    );
    res.status(200).json({
      success: true,
      data: { message: "Transaction deleted successfully" }
    });
  } catch (error) {
    next(error);
  }
};
