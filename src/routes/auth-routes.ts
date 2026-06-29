import express from "express";
import { signup, login } from "../Controllers/auth-controller";
import { restrictTo } from "../middlewares/authMiddleware";
import { protect } from "../middlewares/authMiddleware";
const auth_router = express.Router();

auth_router.post("/signup", protect, restrictTo("admin"), signup);
auth_router.post("/login", login);

export default auth_router;
