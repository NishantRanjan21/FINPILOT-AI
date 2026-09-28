/**
 * Category color system — deterministic, consistent across the entire application.
 * If a category has a backend color, use it.
 * If color is null, generate a deterministic fallback from the category name.
 */

// Curated finance-appropriate color palette for fallbacks
const FALLBACK_PALETTE = [
  "#0ea5a0", // teal
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#ec4899", // pink
  "#14b8a6", // teal-light
  "#ef4444", // red
  "#a855f7", // purple
  "#22c55e", // green
  "#fb923c", // orange
  "#0891b2", // cyan
  "#64748b", // slate
  "#d97706", // yellow
];

/**
 * Get the display color for a category.
 * Uses the stored color or generates a deterministic fallback.
 */
export function getCategoryColor(
  categoryId: string,
  storedColor: string | null | undefined
): string {
  if (storedColor) return storedColor;
  // Generate deterministic index from category ID
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    hash = (hash << 5) - hash + categoryId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}

/**
 * Get a lighter (background) version of a hex color.
 */
export function colorToBackground(hex: string, alpha = 0.12): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Build a lookup map from category ID → color for use in charts.
 */
export function buildCategoryColorMap(
  categories: Array<{ id: string; color: string | null }>
): Record<string, string> {
  return Object.fromEntries(
    categories.map((cat) => [cat.id, getCategoryColor(cat.id, cat.color)])
  );
}

/**
 * Validate a hex color string (#rrggbb format)
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

export { FALLBACK_PALETTE };
