export interface UserSchema {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordChangedAt: Date;
  confirmPassword: string | undefined;
  role: "admin" | "team leader" | "data entry" | "user";
  createdAt: Date;
}
