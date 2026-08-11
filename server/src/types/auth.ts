import { Request } from "express";
import { SafeUser } from "./user";

export interface RegisterInput {
  fullName?: string;
  email?: string;
  password?: string;
}

export interface LoginInput {
  email?: string;
  password?: string;
}

export interface JwtPayload {
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}
