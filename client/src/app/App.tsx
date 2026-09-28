import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setUser, clearUser } from "@/store/authSlice";
import { authApi } from "@/features/auth/authApiSlice";
import { useTheme } from "@/hooks/useTheme";
import { ProtectedRoute, PublicRoute } from "@/routes/Guards";
import { AppShell } from "@/layouts/AppShell";

// Pages
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { TransactionDetailPage } from "@/pages/TransactionDetailPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { BudgetsPage } from "@/pages/BudgetsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { SettingsPage } from "@/pages/SettingsPage";

// App-level theme sync (reads from auth state, applies dark class to DOM)
function ThemeSync() {
  useTheme();
  return null;
}

// Auth bootstrap — checks existing cookie session on app mount
function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const promise = dispatch(
      authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })
    );
    promise
      .unwrap()
      .then((user) => dispatch(setUser(user)))
      .catch(() => dispatch(clearUser()));
    return () => promise.abort();
  }, [dispatch]);

  return null;
}

// Branded loading screen while auth check is in-flight
function BootstrapScreen() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--accent)] flex items-center justify-center animate-pulse">
          <span className="text-white text-base font-bold">F</span>
        </div>
        <div className="space-y-2 text-center">
          <div className="skeleton h-3 w-28 mx-auto" />
          <div className="skeleton h-2 w-20 mx-auto" />
        </div>
      </div>
    </div>
  );
}

// Protected layout wrapping all authenticated pages
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export function App() {
  const { isBootstrapping } = useAppSelector((s) => s.auth);

  return (
    <BrowserRouter>
      <ThemeSync />
      <AuthBootstrap />
      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      {isBootstrapping ? (
        <BootstrapScreen />
      ) : (
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
          <Route path="/transactions" element={<ProtectedLayout><TransactionsPage /></ProtectedLayout>} />
          <Route path="/transactions/:id" element={<ProtectedLayout><TransactionDetailPage /></ProtectedLayout>} />
          <Route path="/categories" element={<ProtectedLayout><CategoriesPage /></ProtectedLayout>} />
          <Route path="/budgets" element={<ProtectedLayout><BudgetsPage /></ProtectedLayout>} />
          <Route path="/analytics" element={<ProtectedLayout><AnalyticsPage /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
