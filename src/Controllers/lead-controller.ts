import type { NextFunction, Request, Response } from "express";
import AppError from "../utils/app-error";
import asyncCatch from "../utils/catch-async";
import Lead from "../Models/lead-modal";
import { LeadSchema } from "../utils/types/lead-types";
import { LEAD_FIELDS } from "../utils/constance";
import APIFeatures from "../utils/features/APIFeatures";
import { safeBodyFields } from "../utils/safe-body";
import User from "../Models/user-modal";
import Project from "../Models/project-modal";

export const getAllLeads = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const LeadFeature = new APIFeatures<LeadSchema>(req.query, Lead, [
      ...LEAD_FIELDS,
      "createdAt",
    ])
      .filter()
      .fields()
      .pagination();

    let query = LeadFeature.query;

    if (req.user.role === "user") {
      query = LeadFeature.query
        .find({ assignedTo: req.user.id })
        .select("-assignedTo");
    }
    query = LeadFeature.query
      .find()
      .populate({
        path: "project",
      })
      .populate("assignedTo", "name email phone role createdAt");

    let leads = await query;

    if (req.user.role === "team leader") {
      const projects = await Project.find({
        $or: [{ leader: req.user._id }, { team: req.user._id }],
      }).populate({
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
      });
      leads = projects.flatMap((project) => (project as any).leads || []);
    }

    res.status(200).json({
      status: "success",
      result: leads.length!,
      data: {
        leads,
      },
    });
  },
);

export const getLead = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const lead = await Lead.findById(req.params.leadId)
      .populate({
        path: "notes.createdBy",
        select: "name email role",
      })
      .populate("createdBy", "name")
      .populate("project", "name")
      .populate("assignedTo", "name");

    if (!lead) {
      return next(new AppError("Lead Not Found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        lead,
      },
    });
  },
);

export const createLeads = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return next(new AppError("Please provide an array of leads", 400));
    }

    const createdLeads = [];
    const skippedLeads = [];

    for (const lead of leads) {
      const fields = safeBodyFields<Partial<LeadSchema>>(lead, LEAD_FIELDS);

      try {
        const newLead = await Lead.create({
          ...fields,
          createdBy: req.user._id,
        });
        createdLeads.push(newLead);
      } catch (err: any) {
        if (err.code === 11000) {
          skippedLeads.push({
            lead: fields,
            reason: "Duplicate lead",
          });
        } else {
          skippedLeads.push({
            lead: fields,
            reason: err.message || "Invalid lead",
          });
        }
      }
    }

    if (createdLeads.length === 0) {
      return next(
        new AppError(
          `No leads were created. ${skippedLeads.length} leads were skipped.`,
          400,
        ),
      );
    }

    res.status(201).json({
      status: skippedLeads.length > 0 ? "partial_success" : "success",
      message: `${createdLeads.length} leads created, ${skippedLeads.length} skipped`,
      data: {
        createdCount: createdLeads.length,
        skippedCount: skippedLeads.length,
        createdLeads,
        skippedLeads,
      },
    });
  },
);

export const updateLead = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const fields = safeBodyFields<Partial<LeadSchema>>(req.body, LEAD_FIELDS);

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.leadId,
      {
        ...fields,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedLead) {
      return next(new AppError("Lead not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        lead: updatedLead,
      },
    });
  },
);

export const assignLeadToUser = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const person = await User.findById(req.params.userId);
    if (!person)
      return next(
        new AppError(
          "User you are trying to assign the lead to is not found!",
          404,
        ),
      );

    await Lead.updateMany(
      { _id: { $in: req.body.leads } },
      { assignedTo: req.params.userId },
    );
    res.status(203).json({ status: "success" });
  },
);

export const addNote = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { note } = req.body;
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.leadId,
      {
        $push: {
          notes: {
            note,
            createdBy: req.user._id,
          },
        },
      },
      { new: true, runValidators: true },
    );

    res.status(201).json({
      status: "success",
      data: {
        lead: updatedLead,
      },
    });
  },
);

export const removeNote = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // First find the lead to check note ownership
    const lead = await Lead.findById(req.params.leadId);

    if (!lead) {
      return next(new AppError("Lead not found!", 404));
    }

    const note = lead.notes.find((n) => n._id.toString() === req.params.noteId);

    if (!note) {
      return next(new AppError("Note not found!", 404));
    }

    const isOwner = note.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return next(
        new AppError("You are not allowed to delete this note!", 403),
      );
    }

    await Lead.findByIdAndUpdate(
      req.params.leadId,
      { $pull: { notes: { _id: req.params.noteId } } },
      { new: true, runValidators: true },
    );

    res.status(204).json({ status: "success" });
  },
);

export const deleteLead = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    await Lead.findByIdAndDelete(req.params.leadId);

    res.status(204).json({
      status: "success",
    });
  },
);

export const assignLeadToProject = asyncCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const project = await Project.findById(req.params.projectId);

    if (!Array.isArray(req.body.leads)) {
      return next(new AppError("Leads must be an array", 400));
    }

    const leads = await Lead.find({ _id: { $in: req.body.leads } });

    if (leads.length !== req.body.leads.length) {
      return next(new AppError("Some leads not found", 404));
    }

    if (!project)
      return next(
        new AppError(
          "Project you are trying to assign the lead to is not found!",
          404,
        ),
      );

    await Lead.updateMany(
      { _id: { $in: req.body.leads } },
      { project: req.params.projectId },
    );

    res.status(200).json({ status: "success" });
  },
);

export const getLeadsStatusStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const matchStage: any = {};

    if (req.user.role === "user") {
      matchStage.assignedTo = req.user.id;
    }

    const stats = await Lead.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const defaultStatuses = [
      "new",
      "contacted",
      "qualified",
      "closed",
      "lost",
      "problem",
      "solved",
    ];

    const formattedStats = defaultStatuses.map((status) => {
      const foundStatus = stats.find((item) => item._id === status);

      return {
        status,
        count: foundStatus ? foundStatus.count : 0,
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        stats: formattedStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
