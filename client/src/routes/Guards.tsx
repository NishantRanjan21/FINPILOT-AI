import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/redux";

/**
 * Wraps protected routes. Redirects to /login if not authenticated.
 * Shows nothing while bootstrapping to prevent flash.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAppSelector((s) => s.auth);

  if (isBootstrapping) return null; // Spinner is shown at root level
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Wraps public routes (login/register). Redirects authenticated users to dashboard.
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAppSelector((s) => s.auth);

  if (isBootstrapping) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
