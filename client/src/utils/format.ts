/**
 * Format a monetary amount using the user's currency preference.
 * This is the ONE centralized currency formatting utility — use it everywhere.
 */
export function formatCurrency(
  amount: number,
  currencyPreference: string = "USD"
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyPreference,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if currency code is invalid
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/**
 * Format a compact amount for display (e.g., 1,200 → 1.2K)
 */
export function formatCompactCurrency(
  amount: number,
  currencyPreference: string = "USD"
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyPreference,
      notation: "compact",
      compactDisplay: "short",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return formatCurrency(amount, currencyPreference);
  }
}

/**
 * Format a date string (YYYY-MM-DD) to a human-readable format
 */
export function formatDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return "";
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

/**
 * Format a month string (YYYY-MM) to a display label
 */
export function formatMonthLabel(monthStr: string): string {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Get the first day of a given month as YYYY-MM-DD
 */
export function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/**
 * Get the last day of a given month as YYYY-MM-DD
 */
export function lastDayOfMonth(year: number, month: number): string {
  const last = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

/**
 * Get current year and month as integers
 */
export function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * Format month name from number (1-12)
 */
export function monthName(month: number): string {
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return names[month - 1] ?? "";
}

/**
 * Extract API error message from RTK Query error
 */
export function extractApiError(error: unknown): string {
  if (!error) return "An unexpected error occurred";
  const err = error as { data?: { error?: { message?: string } }; status?: number };
  if (err.data?.error?.message) return err.data.error.message;
  if (err.status === 429) return "Too many requests. Please try again later.";
  if (err.status === 500) return "A server error occurred. Please try again.";
  return "An unexpected error occurred";
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
