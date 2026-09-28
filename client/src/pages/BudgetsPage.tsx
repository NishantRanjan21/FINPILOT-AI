import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  useGetBudgetsQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} from "@/features/budgets/budgetsApiSlice";
import { useGetCategoriesQuery } from "@/features/categories/categoriesApiSlice";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/Alert";
import { useCurrency } from "@/hooks/useCurrency";
import { getCategoryColor } from "@/utils/categoryColors";
import { extractApiError, monthName, currentYearMonth } from "@/utils/format";
import { clamp } from "@/utils/format";
import type { SafeBudget } from "@/types";

// ── Schemas ──────────────────────────────────────────────────

const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  limitAmount: z
    .string()
    .min(1, "Limit amount is required")
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0, {
      message: "Enter a valid positive amount",
    }),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

const editSchema = z.object({
  limitAmount: z
    .string()
    .min(1, "Limit amount is required")
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0, {
      message: "Enter a valid positive amount",
    }),
});

type BudgetCreateForm = z.infer<typeof budgetSchema>;
type BudgetEditForm = z.infer<typeof editSchema>;

// ── Progress Bar ──────────────────────────────────────────────

function getBudgetColor(pct: number): string {
  if (pct > 100) return "var(--budget-over)";
  if (pct >= 90) return "var(--budget-danger)";
  if (pct >= 70) return "var(--budget-warning)";
  return "var(--budget-healthy)";
}

function BudgetProgressBar({ pct }: { pct: number }) {
  const displayPct = clamp(pct, 0, 100);
  const color = getBudgetColor(pct);

  return (
    <div className="progress-bar">
      <motion.div
        className="progress-fill"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${displayPct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// ── Budget Card ───────────────────────────────────────────────

function BudgetCard({
  budget,
  categories,
  onEdit,
  onDelete,
}: {
  budget: SafeBudget;
  categories: Array<{ id: string; color: string | null; name: string }>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { format } = useCurrency();
  const cat = categories.find((c) => c.id === budget.categoryId);
  const color = getCategoryColor(budget.categoryId, cat?.color ?? null);
  const pct = budget.progressPercentage;
  const isOver = pct > 100;
  const budgetColor = getBudgetColor(pct);

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: color }}
          >
            {budget.categoryName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {budget.categoryName}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {monthName(budget.month)} {budget.year}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="btn btn-ghost btn-sm p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Edit budget"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="btn btn-ghost btn-sm p-1.5 text-[var(--text-muted)] hover:text-[var(--expense)]"
            aria-label="Delete budget"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">
            {format(budget.spentAmount)} spent
          </span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: budgetColor }}
          >
            {pct.toFixed(0)}%
          </span>
        </div>
        <BudgetProgressBar pct={pct} />
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">of {format(budget.limitAmount)}</span>
          {isOver ? (
            <span className="flex items-center gap-1 font-medium" style={{ color: "var(--budget-over)" }}>
              <AlertTriangle size={11} />
              {format(Math.abs(budget.remainingAmount))} over budget
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">
              {format(budget.remainingAmount)} remaining
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      {isOver && (
        <div className="text-xs font-medium px-2 py-1 rounded bg-[var(--expense-bg)] text-[var(--expense)] text-center">
          Over budget by {format(Math.abs(budget.remainingAmount))}
        </div>
      )}
    </div>
  );
}

// ── Month Selector ────────────────────────────────────────────

function MonthSelector({
  month,
  year,
  onChange,
}: {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}) {
  const prev = () => {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  };
  const next = () => {
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={prev} className="btn btn-ghost btn-sm p-1.5">
        <ChevronLeft size={15} />
      </button>
      <span className="text-sm font-semibold text-[var(--text-primary)] min-w-[120px] text-center">
        {monthName(month)} {year}
      </span>
      <button onClick={next} className="btn btn-ghost btn-sm p-1.5">
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ── Create Modal ──────────────────────────────────────────────

function CreateBudgetModal({
  isOpen,
  onClose,
  defaultMonth,
  defaultYear,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultMonth: number;
  defaultYear: number;
}) {
  const { data: categories = [] } = useGetCategoriesQuery();
  const [create, { isLoading }] = useCreateBudgetMutation();
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BudgetCreateForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { month: defaultMonth, year: defaultYear, limitAmount: "" },
  });

  const onSubmit = async (data: BudgetCreateForm) => {
    try {
      await create({
        categoryId: data.categoryId,
        month: data.month,
        year: data.year,
        limitAmount: Number(data.limitAmount),
      }).unwrap();
      toast.success("Budget created");
      reset();
      onClose();
    } catch (err) {
      if ((err as any)?.status === 409) {
        toast.error("A budget already exists for this category and month.");
      } else {
        toast.error(extractApiError(err));
      }
    }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Budget">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Expense category
          </label>
          <select className="input-base" {...register("categoryId")}>
            <option value="">Select a category</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="field-error">{errors.categoryId.message}</p>}
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Only expense categories can have budgets
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Month</label>
            <select className="input-base" {...register("month", { valueAsNumber: true })}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{monthName(i + 1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Year</label>
            <input type="number" className="input-base tabular-nums" {...register("year", { valueAsNumber: true })} min="2020" max="2030" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Budget limit</label>
          <input type="text" inputMode="decimal" className="input-base tabular-nums" placeholder="0.00" {...register("limitAmount")} />
          {errors.limitAmount && <p className="field-error">{errors.limitAmount.message}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={handleClose} className="btn btn-secondary flex-1" disabled={isLoading}>Cancel</button>
          <button type="submit" disabled={isLoading} className="btn btn-primary flex-1">{isLoading ? "Creating..." : "Create Budget"}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Modal ────────────────────────────────────────────────

function EditBudgetModal({ budget, onClose }: { budget: SafeBudget | null; onClose: () => void }) {
  const [update, { isLoading }] = useUpdateBudgetMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<BudgetEditForm>({
    resolver: zodResolver(editSchema),
    values: budget ? { limitAmount: String(budget.limitAmount) } : undefined,
  });

  const onSubmit = async (data: BudgetEditForm) => {
    if (!budget) return;
    try {
      await update({ id: budget.id, limitAmount: Number(data.limitAmount) }).unwrap();
      toast.success("Budget updated");
      onClose();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  return (
    <Modal isOpen={!!budget} onClose={onClose} title="Edit Budget">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Editing budget for{" "}
            <span className="font-semibold text-[var(--text-primary)]">{budget?.categoryName}</span>{" "}
            · {budget ? `${monthName(budget.month)} ${budget.year}` : ""}
          </p>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">New limit amount</label>
          <input type="text" inputMode="decimal" className="input-base tabular-nums" placeholder="0.00" {...register("limitAmount")} />
          {errors.limitAmount && <p className="field-error">{errors.limitAmount.message}</p>}
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1" disabled={isLoading}>Cancel</button>
          <button type="submit" disabled={isLoading} className="btn btn-primary flex-1">{isLoading ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export function BudgetsPage() {
  const { month: currMonth, year: currYear } = currentYearMonth();
  const [month, setMonth] = useState(currMonth);
  const [year, setYear] = useState(currYear);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SafeBudget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SafeBudget | null>(null);

  const { data: budgets = [], isLoading, error, refetch } = useGetBudgetsQuery({ month, year });
  const { data: categories = [] } = useGetCategoriesQuery();
  const [deleteBudget, { isLoading: isDeleting }] = useDeleteBudgetMutation();

  const { format } = useCurrency();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBudget(deleteTarget.id).unwrap();
      toast.success("Budget deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractApiError(err));
      setDeleteTarget(null);
    }
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Budgets</h1>
          <p className="text-sm text-[var(--text-muted)]">Track your monthly spending limits</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector
            month={month}
            year={year}
            onChange={(m, y) => { setMonth(m); setYear(y); }}
          />
          <button onClick={() => setCreateOpen(true)} className="btn btn-primary btn-sm gap-1.5">
            <Plus size={14} />
            New Budget
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {!isLoading && budgets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-xs text-[var(--text-muted)]">Budgeted</p>
            <p className="text-lg font-bold tabular-nums mt-1">{format(totalBudgeted)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-[var(--text-muted)]">Spent</p>
            <p className="text-lg font-bold tabular-nums mt-1 amount-expense">{format(totalSpent)}</p>
          </div>
          <div className="stat-card col-span-2 sm:col-span-1">
            <p className="text-xs text-[var(--text-muted)]">Remaining</p>
            <p className={`text-lg font-bold tabular-nums mt-1 ${totalBudgeted - totalSpent < 0 ? "amount-expense" : "amount-income"}`}>
              {format(totalBudgeted - totalSpent)}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <ErrorState message="Failed to load budgets." onRetry={refetch} />}

      {/* Budget grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            No budgets for {monthName(month)} {year}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Create a budget to start tracking your spending limits
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="btn btn-primary btn-sm mt-4 gap-1.5"
          >
            <Plus size={13} />
            Create Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              categories={categories}
              onEdit={() => setEditTarget(budget)}
              onDelete={() => setDeleteTarget(budget)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateBudgetModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultMonth={month}
        defaultYear={year}
      />
      <EditBudgetModal budget={editTarget} onClose={() => setEditTarget(null)} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Budget"
        message={`Delete the budget for "${deleteTarget?.categoryName}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
