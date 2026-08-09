import { RequestHandler } from "express";

export const requestLogger: RequestHandler = (
  req,
  _res,
  next
) => {
  const timestamp = new Date().toISOString();

  console.log(
    `[${timestamp}] ${req.method} ${req.originalUrl}`
  );

  next();
};