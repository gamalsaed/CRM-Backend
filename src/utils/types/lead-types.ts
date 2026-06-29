import type { ObjectId } from "mongoose";

export interface LeadSchema {
  name: string;
  phone: string;
  whatsApp: string;
  email: string;
  address: string;
  createdAt: Date;
  project: ObjectId;
  createdBy: ObjectId;
  source:
    | "tik tok"
    | "snapchat"
    | "facebook"
    | "instagram"
    | "recommended"
    | "other";
  status: "new" | "contacted" | "qualified" | "closed";
  assignedTo: ObjectId;
  notes: {
    note: string;
    createdAt: Date;
    createdBy: ObjectId;
    _id: ObjectId;
  }[];
}
