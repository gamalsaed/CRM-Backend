import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import { UserSchema } from "../utils/types/user-types";

const userSchema = new mongoose.Schema<UserSchema>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "Please provide a valid email"],
    lowercase: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    validate: [validator.isMobilePhone, "Please provide a valid phone number"],
  },
  password: {
    type: String,
    required: true,
    validate: [
      validator.isStrongPassword,
      "Password must be at least 8 chars that contain at least 1 capital chat, 1 small char, numbers and special chars",
    ],
  },
  confirmPassword: {
    type: String,
    required: true,
    validate: {
      validator: function (this: any, val: string): boolean {
        return val === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: ["admin", "team leader", "data entry", "user"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined;
});

const User = mongoose.model<UserSchema>("User", userSchema);

export default User;
