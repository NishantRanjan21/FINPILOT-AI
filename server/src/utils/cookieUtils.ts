import { Response, CookieOptions } from "express";
import { env } from "../config/env";

export const AUTH_COOKIE_NAME = "finpilot_token";

const getCookieOptions = (): CookieOptions => {
  const isProduction = env.nodeEnv === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  };
};

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
};

export const clearAuthCookie = (res: Response): void => {
  const isProduction = env.nodeEnv === "production";
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax"
  });
};
