import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayload } from "../types/auth";

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: "7d"
  });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    if (decoded && typeof decoded.userId === "string") {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
};
