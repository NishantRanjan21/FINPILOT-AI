import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMetadata } from "@/types";

interface PaginationProps {
  pagination: PaginationMetadata;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({
  pagination,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const { page, totalPages, hasPrevPage, hasNextPage, total, limit } = pagination;

  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Generate page numbers to show
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between py-3 px-4 border-t border-[var(--border)]">
      <p className="text-xs text-[var(--text-muted)]">
        Showing <span className="font-medium text-[var(--text-secondary)]">{start}–{end}</span> of{" "}
        <span className="font-medium text-[var(--text-secondary)]">{total}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage || disabled}
          className="btn btn-ghost btn-sm p-1.5"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="w-8 text-center text-[var(--text-muted)] text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={disabled}
              className={`btn btn-sm w-8 px-0 ${
                p === page
                  ? "btn-primary"
                  : "btn-ghost text-[var(--text-secondary)]"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage || disabled}
          className="btn btn-ghost btn-sm p-1.5"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
