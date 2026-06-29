import express from "express";
import {
  getAllUsers,
  getUser,
  deleteUser,
  getMyInfo,
  updateUser,
  updateMyPassword,
  updateUserPassword,
} from "../Controllers/user-controller";
import { restrictTo } from "../middlewares/authMiddleware";
const user_router = express.Router();

user_router.get("/my-info", getMyInfo);
user_router.patch("/update-user-role/:userId", restrictTo("admin"), updateUser);
user_router.patch("/update-user/:userId", updateUser);
user_router.patch("/update-my-info", updateUser);
user_router.patch("/change-my-password", updateMyPassword);
user_router.patch(
  "/change-password/:userId",
  restrictTo("admin"),
  updateUserPassword,
);

user_router
  .route("/:userId")
  .get(restrictTo("admin", "team leader"), getUser)
  .delete(restrictTo("admin"), deleteUser);

user_router.get("/", restrictTo("admin", "team leader"), getAllUsers);

export default user_router;
