import express from "express";
import {
  getAllLeads,
  createLeads,
  updateLead,
  getLead,
  deleteLead,
  addNote,
  removeNote,
  assignLeadToUser,
  assignLeadToProject,
  getLeadsStatusStats,
} from "../Controllers/lead-controller";
import { restrictTo } from "../middlewares/authMiddleware";

const lead_router = express.Router();

lead_router.post("/:leadId/notes", addNote);
lead_router.delete("/:leadId/notes/:noteId", removeNote);

lead_router.patch("/assign-to-project/:projectId", assignLeadToProject);

lead_router.patch(
  "/assign-to-user/:userId",
  restrictTo("admin", "team leader"),
  assignLeadToUser,
);

lead_router.get("/status-stats", getLeadsStatusStats);

lead_router
  .route("/:leadId")
  .get(getLead)
  .patch(updateLead)
  .delete(restrictTo("admin"), deleteLead);

lead_router.route("/").get(getAllLeads).post(createLeads);
export default lead_router;
