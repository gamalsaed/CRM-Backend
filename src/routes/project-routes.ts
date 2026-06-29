import express from "express";
import { restrictTo } from "../middlewares/authMiddleware";
import {
  createProject,
  deleteProject,
  getAllProjects,
  updateProject,
  addUsersToProject,
  removeUserFromProject,
  getProject,
  myProjects,
  assignLeader,
} from "../Controllers/project-controller";

const project_router = express.Router();

project_router.patch(
  "/:projectId/remove-user",
  restrictTo("admin", "team leader"),
  removeUserFromProject,
); // done

project_router.patch(
  "/:projectId/add-user",
  restrictTo("admin", "team leader"),
  addUsersToProject,
); // done

project_router.patch("/:projectId/:userId", restrictTo("admin"), assignLeader);

project_router.get("/my-projects", myProjects); // done

project_router
  .route("/:projectId")
  .patch(restrictTo("admin"), updateProject) // done
  .delete((restrictTo("admin"), deleteProject)) // done
  .get(getProject); // done

project_router
  .route("/")
  .all(restrictTo("admin"))
  .get(getAllProjects) // done
  .post(createProject); // done

export default project_router;
