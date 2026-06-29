import express, { type NextFunction, Request, Response } from "express";
import { errorController } from "./Controllers/error-controller";
import lead_router from "./routes/leads-routes";
import auth_router from "./routes/auth-routes";
import user_router from "./routes/user-routes";
import project_router from "./routes/project-routes";
import cors from "cors";

import { protect } from "./middlewares/authMiddleware";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/v1/leads", protect, lead_router);
app.use("/api/v1/auth", auth_router);
app.use("/api/v1/users", protect, user_router);
app.use("/api/v1/projects", protect, project_router);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl}`,
  });
});

app.use(errorController);

export default app;
