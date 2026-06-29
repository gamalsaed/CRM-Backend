import type { Request, Response, NextFunction } from "express";
import User from "../Models/user-modal";
import asyncCatch from "../utils/catch-async";
import jwt from "jsonwebtoken";
import AppError from "../utils/app-error";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer")
    ) {
      return next(new AppError("You need to login and try again", 403));
    }

    const decodedToken = jwt.verify(
      req.headers.authorization.split(" ")[1] as string,
      process.env.JWT_SECRET!,
    );

    const user = await User.findOne({
      _id: (decodedToken as jwt.JwtPayload).id,
    }).select("-__v -password");

    if (!user) return next(new AppError("You are not authorized", 403));

    if (user.passwordChangedAt) {
      const changedTime = user.passwordChangedAt.getTime() / 1000;
      const iat = (decodedToken as jwt.JwtPayload).iat as number;

      if (changedTime > iat) {
        return next(
          new AppError(
            "Your password has ben changed. please log in again",
            403,
          ),
        );
      }
    }

    req.user = user;
    next();
  },
);

export function restrictTo(
  ...role: ("admin" | "team leader" | "data entry" | "user")[]
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!role.includes(req.user.role)) {
      return next(new AppError("You are not authorized", 403));
    }

    next();
  };
}
