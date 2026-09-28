import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  User,
} from "lucide-react";
import { useAppSelector } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { useLogoutMutation } from "@/features/auth/authApiSlice";
import { clearUser } from "@/store/authSlice";
import { useAppDispatch } from "@/hooks/redux";
import { api } from "@/store/apiSlice";
import { toast } from "sonner";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/categories", icon: Tag, label: "Categories" },
  { to: "/budgets", icon: Wallet, label: "Budgets" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

function NavItems({ onClose }: { onClose?: () => void }) {
  return (
    <nav className="flex-1 py-2 px-2 space-y-0.5">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={onClose}
        >
          <Icon size={16} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const user = useAppSelector((s) => s.auth.user);
  const { theme, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      dispatch(clearUser());
      dispatch(api.util.resetApiState());
      navigate("/login");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--radius)] bg-[var(--accent)] flex items-center justify-center">
            <span className="text-white text-xs font-bold">F</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] leading-none">FinPilot</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Personal Finance</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="btn btn-ghost btn-sm ml-auto p-1.5">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <NavItems onClose={onClose} />

      {/* Bottom */}
      <div className="px-2 py-2 border-t border-[var(--border)] space-y-0.5">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="nav-item w-full"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* User */}
        {user && (
          <div className="px-2 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--accent-light)] flex items-center justify-center shrink-0">
              <User size={13} className="text-[var(--accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">{user.fullName}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="nav-item w-full text-[var(--error)] hover:bg-[var(--error-bg)]"
        >
          <LogOut size={16} />
          <span>{isLoading ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)]"
        style={{ width: "var(--sidebar-width)" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border)] md:hidden"
              style={{ width: "var(--sidebar-width)" }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="btn btn-ghost btn-sm p-1.5"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">F</span>
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">FinPilot</span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm p-1.5 text-[var(--text-secondary)]"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
