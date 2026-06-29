import type { NextFunction, Request, Response } from "express";
import User from "../Models/user-modal";
import asyncCatch from "../utils/catch-async";
import { USER_FIELDS } from "../utils/constance";
import { safeBodyFields } from "../utils/safe-body";
import AppError from "../utils/app-error";
import bcrypt from "bcrypt";
import APIFeatures from "../utils/features/APIFeatures";
import Project from "../Models/project-modal";
import Lead from "../Models/lead-modal";
import { generateToken } from "../utils/jwt-generator";

export const getAllUsers = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const UserFeature = new APIFeatures(req.query, User, [
      ...USER_FIELDS.slice(0, 1),
      "createdAt",
      "role",
    ])
      .filter()
      .fields();

    let query = await UserFeature.query;

    if (req.user.role === "team leader") {
      const projects = await Project.find({
        $or: [{ leader: req.user._id }, { team: req.user._id }],
      }).populate("team", "name email phone role");
      query = projects.flatMap((project) => (project as any).team || []);
    }

    res.status(201).json({
      status: "success",
      result: query.length,
      data: {
        query,
      },
    });
  },
);

export const getUser = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.userId).select(
      "-__v -password",
    );

    if (!user) return next(new AppError("User not found!", 404));
    const query =
      user.role === "team leader" ? { leader: user?._id } : { team: user?._id };
    const projects = await Project.find(query)
      .populate({
        path: "leads",
        populate: [
          {
            path: "assignedTo",
            select: "name email phone role",
          },
          {
            path: "project",
            select: "name description",
          },
        ],
      })
      .populate("createdBy", "name")
      .populate("team", "name email phone role")
      .populate("leader", "name email phone");

    const leads = await Lead.find({
      assignedTo: user._id as any,
    }).select("-assignedTo");

    res.status(201).json({
      status: "success",
      data: {
        user,
        projects,
        leads,
      },
    });
  },
);

export const deleteUser = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    await User.findByIdAndDelete(req.params.userId);

    res.status(204).json({
      status: "success",
    });
  },
);

export const getMyInfo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(201).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
};

export const updateUser = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const targetUserId = req.params.userId || req.user._id.toString();
    let filteredBody = safeBodyFields(req.body, USER_FIELDS.slice(0, 3));

    if (req.path.includes("role")) {
      if (
        !req.body.role ||
        !["admin", "team leader", "data entry", "user"].includes(
          req.body.role,
        ) ||
        !req.params.userId
      ) {
        return next(new AppError("Role and User ID are required", 404));
      }
      filteredBody = { role: req.body.role };
    }

    // لازم نجيب ال role القديم قبل التحديث عشان نقارن بعدين
    let oldRole: string | undefined;
    if (filteredBody.role) {
      const existingUser = await User.findById(targetUserId).select("role");
      if (!existingUser) {
        return next(new AppError("User not found", 404));
      }
      oldRole = existingUser.role;
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
      {
        ...filteredBody,
      },
      {
        runValidators: true,
        new: true,
      },
    ).select("-__v -password");

    // لو حصل demotion من role كان قادر يكون project leader لـ role مش قادر
    if (filteredBody.role && oldRole) {
      const leaderEligibleRoles = ["admin", "team leader"];
      const wasEligible = leaderEligibleRoles.includes(oldRole);
      const newRole =
        typeof filteredBody.role === "string" ? filteredBody.role : "";
      const isEligible = leaderEligibleRoles.includes(newRole);

      if (wasEligible && !isEligible) {
        await Project.updateMany(
          { leader: targetUserId },
          { $set: { leader: null } },
        );
      }
    }

    res.status(201).json({
      status: "success",
      data: {
        user,
      },
    });
  },
);

export const updateMyPassword = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    if (
      !req.body.newPassword ||
      !req.body.confirmPassword ||
      !req.body.oldPassword
    ) {
      return next(
        new AppError(
          "Password ,Confirm password and the old password are required!",
          402,
        ),
      );
    }

    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError("Login before you do that", 403));

    const isCorrect = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!isCorrect) return next(new AppError("Wrong password", 403));

    user.password = req.body.newPassword;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      status: "success",
      token,
    });
  },
);

export const updateUserPassword = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.userId);

    if (!req.body.newPassword || !req.body.confirmPassword) {
      return next(
        new AppError(
          "Password ,Confirm password and the old password are required!",
          402,
        ),
      );
    }

    if (!user) return next(new AppError("Login before you do that", 403));

    user.password = req.body.newPassword;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(201).json({
      status: "success",
    });
  },
);
