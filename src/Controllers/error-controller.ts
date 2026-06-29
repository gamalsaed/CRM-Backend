import type { Request, Response, NextFunction } from "express";
import AppError from "../utils/app-error";

export const errorController = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "fail";
  res.status(statusCode).json({
    status,
    message: err.message,
  });
};
