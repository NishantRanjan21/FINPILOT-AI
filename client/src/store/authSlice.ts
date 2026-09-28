import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SafeUser } from "@/types";

export type Theme = "light" | "dark";

export function getStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem("finpilot_theme");
    if (saved === "dark" || saved === "light") return saved;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // fallback
  }
  return "light";
}

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean; // true while GET /api/auth/me is in-flight
  theme: Theme;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  theme: getStoredTheme(),
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<SafeUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isBootstrapping = false;
      const pref = action.payload.themePreference;
      if (pref === "dark" || pref === "light") {
        state.theme = pref;
        try {
          localStorage.setItem("finpilot_theme", pref);
        } catch {}
      }
    },
    updateUser(state, action: PayloadAction<Partial<SafeUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        const pref = action.payload.themePreference;
        if (pref === "dark" || pref === "light") {
          state.theme = pref;
          try {
            localStorage.setItem("finpilot_theme", pref);
          } catch {}
        }
      }
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      if (state.user) {
        state.user.themePreference = action.payload;
      }
      try {
        localStorage.setItem("finpilot_theme", action.payload);
      } catch {}
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isBootstrapping = false;
    },
    setBootstrapping(state, action: PayloadAction<boolean>) {
      state.isBootstrapping = action.payload;
    },
  },
});

export const { setUser, updateUser, setTheme, clearUser, setBootstrapping } = authSlice.actions;

export default authSlice.reducer;
