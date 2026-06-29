import type { NextFunction, Request, Response } from "express";
import { USER_FIELDS } from "../utils/constance";
import { UserSchema } from "../utils/types/user-types";
import { safeBodyFields } from "../utils/safe-body";
import asyncCatch from "../utils/catch-async";
import User from "../Models/user-modal";
import { generateToken } from "../utils/jwt-generator";
import AppError from "../utils/app-error";
import bcrypt from "bcrypt";

export const signup = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_fields = safeBodyFields<UserSchema>(req.body, USER_FIELDS);
    const user: Partial<UserSchema> = await User.create(user_fields);

    res.status(201).json({
      status: "success",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      },
    });
  },
);

export const login = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.email || !req.body.password) {
      return next(new AppError("Email and Password are required", 400));
    }
    const user = await User.findOne({ email: req.body.email });

    const passwordIsCorrect = await bcrypt.compare(
      req.body.password,
      user?.password!,
    );

    if (!user || !passwordIsCorrect) {
      return next(new AppError("Invalid Email or Password", 400));
    }

    const token = generateToken(user._id);
    res.status(201).json({
      status: "success",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  },
);
