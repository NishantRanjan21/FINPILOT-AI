import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import { setTheme as setReduxTheme, type Theme } from "@/store/authSlice";
import { useUpdateProfileMutation } from "@/features/user/userApiSlice";

/**
 * Manages the dark/light theme based on the user's preference.
 * Synchronously updates Redux state, localStorage, and document root class,
 * and persists to backend if the user is authenticated.
 */
export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.auth.theme);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [updateProfile] = useUpdateProfileMutation();

  // Keep DOM class in sync with theme state
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const setTheme = useCallback(
    async (nextTheme: Theme) => {
      // 1. Immediately apply to Redux and DOM for instant UI feedback
      dispatch(setReduxTheme(nextTheme));
      const root = document.documentElement;
      if (nextTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      // 2. Persist to backend if user is authenticated
      if (isAuthenticated) {
        try {
          await updateProfile({ themePreference: nextTheme }).unwrap();
        } catch (err) {
          console.error("Failed to persist theme preference to backend:", err);
        }
      }
    },
    [dispatch, isAuthenticated, updateProfile]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [theme, setTheme]);

  return { theme, toggleTheme, setTheme };
}
