import mongoose from "mongoose";
import validator from "validator";
import { LeadSchema } from "../utils/types/lead-types";

const leadSchema = new mongoose.Schema<LeadSchema>({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    validate: [validator.isMobilePhone, "Please provide a valid phone number"],
  },
  whatsApp: {
    type: String,
    validate: [validator.isMobilePhone, "Please provide a valid phone number"],
  },
  email: {
    type: String,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  },
  status: {
    type: String,
    enum: [
      "new",
      "contacted",
      "qualified",
      "closed",
      "lost",
      "problem",
      "solved",
    ],
    default: "new",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  source: {
    type: String,
    enum: [
      "tik tok",
      "snapchat",
      "facebook",
      "instagram",
      "recommended",
      "other",
    ],
    default: "other",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: [
    {
      note: {
        type: String,
        required: true,
        min: 5,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
  ],
});

const Lead = mongoose.model<LeadSchema>("Lead", leadSchema);

export default Lead;
