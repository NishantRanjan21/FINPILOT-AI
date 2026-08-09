import { Request, Response } from "express";
import { ApiSuccessResponse } from "../types/api";

interface HealthData {
  status: "ok";
}

export const getHealth = (
  _req: Request,
  res: Response<ApiSuccessResponse<HealthData>>
): void => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok"
    }
  });
};