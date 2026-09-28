import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  SortAsc,
  SortDesc,
  Pencil,
  Trash2,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} from "@/features/transactions/transactionsApiSlice";
import { useGetCategoriesQuery } from "@/features/categories/categoriesApiSlice";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/Alert";
import { useDebounce } from "@/hooks/useDebounce";
import { useCurrency } from "@/hooks/useCurrency";
import { formatDate, extractApiError, todayString } from "@/utils/format";
import { getCategoryColor } from "@/utils/categoryColors";
import type { SafeTransaction, TransactionFilters, SafeCategory } from "@/types";

// ── Transaction Form ──────────────────────────────────────────

const txSchema = z.object({
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Category is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0, {
      message: "Enter a valid positive amount (max 2 decimal places)",
    })
    .refine((v) => Number(v) <= 999999999.99, "Amount exceeds maximum"),
  description: z.string().max(500, "Max 500 chars").optional(),
  transactionDate: z
    .string()
    .min(1, "Date is required")
    .refine((v) => v <= todayString(), "Date cannot be in the future"),
});

type TxForm = z.infer<typeof txSchema>;

function TransactionForm({
  initial,
  onSuccess,
  onCancel,
}: {
  initial?: SafeTransaction | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { data: categories = [] } = useGetCategoriesQuery();
  const [create, { isLoading: isCreating }] = useCreateTransactionMutation();
  const [update, { isLoading: isUpdating }] = useUpdateTransactionMutation();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TxForm>({
    resolver: zodResolver(txSchema),
    defaultValues: initial
      ? {
          type: initial.type,
          categoryId: initial.categoryId,
          amount: String(initial.amount),
          description: initial.description ?? "",
          transactionDate: initial.transactionDate,
        }
      : {
          type: "expense",
          transactionDate: todayString(),
        },
  });

  const selectedType = watch("type");
  const filteredCategories = categories.filter((c) => c.type === selectedType);

  // Reset category when type changes
  useEffect(() => {
    if (!initial) setValue("categoryId", "");
  }, [selectedType]);

  const onSubmit = async (data: TxForm) => {
    try {
      if (initial) {
        await update({
          id: initial.id,
          categoryId: data.categoryId,
          type: data.type,
          amount: Number(data.amount),
          description: data.description || null,
          transactionDate: data.transactionDate,
        }).unwrap();
        toast.success("Transaction updated");
      } else {
        await create({
          categoryId: data.categoryId,
          type: data.type,
          amount: Number(data.amount),
          description: data.description || null,
          transactionDate: data.transactionDate,
        }).unwrap();
        toast.success("Transaction added");
      }
      reset();
      onSuccess();
    } catch (err) {
      const status = (err as any)?.status;
      if (status === 422) {
        toast.error("Category type doesn't match transaction type.");
      } else {
        toast.error(extractApiError(err));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Transaction type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["expense", "income"] as const).map((t) => (
            <label
              key={t}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--radius)] border cursor-pointer text-sm font-medium transition-all ${
                selectedType === t
                  ? t === "income"
                    ? "bg-[var(--income-bg)] text-[var(--income)] border-[var(--income)]"
                    : "bg-[var(--expense-bg)] text-[var(--expense)] border-[var(--expense)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
              }`}
            >
              <input
                type="radio"
                value={t}
                className="sr-only"
                {...register("type")}
              />
              <span className="capitalize">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Category
        </label>
        <select className="input-base" {...register("categoryId")}>
          <option value="">Select a category</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="field-error">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Amount
        </label>
        <input
          type="text"
          inputMode="decimal"
          className="input-base tabular-nums"
          placeholder="0.00"
          {...register("amount")}
        />
        {errors.amount && <p className="field-error">{errors.amount.message}</p>}
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Date
        </label>
        <input
          type="date"
          max={todayString()}
          className="input-base"
          {...register("transactionDate")}
        />
        {errors.transactionDate && (
          <p className="field-error">{errors.transactionDate.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Description{" "}
          <span className="text-[var(--text-muted)] font-normal">(optional)</span>
        </label>
        <input
          type="text"
          className="input-base"
          placeholder="e.g. Monthly groceries"
          {...register("description")}
        />
        {errors.description && (
          <p className="field-error">{errors.description.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary flex-1"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary flex-1"
        >
          {isLoading
            ? initial
              ? "Saving..."
              : "Adding..."
            : initial
            ? "Save Changes"
            : "Add Transaction"}
        </button>
      </div>
    </form>
  );
}

// ── Filter Bar ────────────────────────────────────────────────

function FilterBar({
  filters,
  onFilterChange,
}: {
  filters: TransactionFilters;
  onFilterChange: (key: keyof TransactionFilters, value: string) => void;
}) {
  const { data: categories = [] } = useGetCategoriesQuery();
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    onFilterChange("search", debouncedSearch);
  }, [debouncedSearch]);

  const hasActiveFilters =
    filters.search ||
    filters.type ||
    filters.category_id ||
    filters.date_from ||
    filters.date_to ||
    filters.min_amount ||
    filters.max_amount;

  const clearFilters = () => {
    setSearchInput("");
    onFilterChange("search", "");
    onFilterChange("type", "");
    onFilterChange("category_id", "");
    onFilterChange("date_from", "");
    onFilterChange("date_to", "");
    onFilterChange("min_amount", "");
    onFilterChange("max_amount", "");
  };

  return (
    <div className="card p-4 space-y-3">
      {/* Row 1: search + type */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <input
            type="text"
            className="input-base input-search !pl-10"
            placeholder="Search transactions..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="input-base !w-auto min-w-[130px]"
            value={filters.type ?? ""}
            onChange={(e) => onFilterChange("type", e.target.value)}
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            className="input-base !w-auto min-w-[150px]"
            value={filters.category_id ?? ""}
            onChange={(e) => onFilterChange("category_id", e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: dates + amounts */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input-base !w-auto"
            value={filters.date_from ?? ""}
            onChange={(e) => onFilterChange("date_from", e.target.value)}
            title="From date"
          />
          <span className="text-[var(--text-muted)] text-xs">to</span>
          <input
            type="date"
            className="input-base !w-auto"
            value={filters.date_to ?? ""}
            onChange={(e) => onFilterChange("date_to", e.target.value)}
            title="To date"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="input-base !w-32 tabular-nums"
            placeholder="Min amount"
            value={filters.min_amount ?? ""}
            onChange={(e) => onFilterChange("min_amount", e.target.value)}
            min="0"
            step="0.01"
          />
          <input
            type="number"
            className="input-base !w-32 tabular-nums"
            placeholder="Max amount"
            value={filters.max_amount ?? ""}
            onChange={(e) => onFilterChange("max_amount", e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn btn-ghost btn-sm gap-1 text-[var(--expense)] ml-auto">
            <X size={13} />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

// ── Transaction Table ─────────────────────────────────────────

type SortKey = "date" | "-date" | "amount" | "-amount";

function TransactionTable({
  transactions,
  isLoading,
  sort,
  onSort,
  onEdit,
  onDelete,
  categories,
}: {
  transactions: SafeTransaction[];
  isLoading: boolean;
  sort: string;
  onSort: (s: SortKey) => void;
  onEdit: (t: SafeTransaction) => void;
  onDelete: (t: SafeTransaction) => void;
  categories: SafeCategory[];
}) {
  const { format } = useCurrency();

  const SortButton = ({ field }: { field: "date" | "amount" }) => {
    const isAsc = sort === field;
    const isDesc = sort === `-${field}`;
    return (
      <button
        onClick={() => onSort((isDesc ? field : `-${field}`) as SortKey)}
        className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
      >
        {field === "date" ? "Date" : "Amount"}
        {isAsc ? (
          <SortAsc size={12} />
        ) : isDesc ? (
          <SortDesc size={12} />
        ) : (
          <SortAsc size={12} className="opacity-30" />
        )}
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th className="hidden sm:table-cell">Category</th>
              <th className="hidden md:table-cell">Type</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={6} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="card py-16 text-center">
        <Filter size={32} className="mx-auto text-[var(--text-disabled)] mb-3" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          No transactions match these filters
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Try adjusting your filters or add a new transaction
        </p>
      </div>
    );
  }

  // Mobile card view
  const MobileCard = ({ tx }: { tx: SafeTransaction }) => {
    const cat = categories.find((c) => c.id === tx.categoryId);
    const color = getCategoryColor(tx.categoryId, cat?.color ?? null);
    return (
      <div className="flex items-center gap-3 py-3 px-4 border-b border-[var(--border)] last:border-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {tx.categoryId.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {tx.description || "—"}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {formatDate(tx.transactionDate)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`text-sm font-semibold tabular-nums ${
              tx.type === "income" ? "amount-income" : "amount-expense"
            }`}
          >
            {tx.type === "income" ? "+" : "-"}
            {format(tx.amount)}
          </p>
          <div className="flex gap-1 justify-end mt-1">
            <button
              onClick={() => onEdit(tx)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDelete(tx)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--expense)]"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop table */}
      <div className="card overflow-hidden hidden sm:block">
        <table className="data-table">
          <thead>
            <tr>
              <th><SortButton field="date" /></th>
              <th>Description</th>
              <th>Category</th>
              <th className="hidden md:table-cell">Type</th>
              <th className="text-right"><SortButton field="amount" /></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const color = getCategoryColor(tx.categoryId, cat?.color ?? null);
              return (
                <tr key={tx.id}>
                  <td className="text-[var(--text-muted)] whitespace-nowrap tabular-nums text-xs">
                    {formatDate(tx.transactionDate)}
                  </td>
                  <td className="max-w-xs">
                    <Link
                      to={`/transactions/${tx.id}`}
                      className="text-[var(--text-primary)] hover:text-[var(--accent)] font-medium truncate block"
                    >
                      {tx.description || "—"}
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[var(--text-secondary)] text-xs truncate">
                        {cat?.name ?? "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    <span
                      className={`badge ${
                        tx.type === "income" ? "badge-income" : "badge-expense"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="text-right">
                    <span
                      className={`font-semibold tabular-nums text-sm ${
                        tx.type === "income" ? "amount-income" : "amount-expense"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {format(tx.amount)}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-0.5 justify-end">
                      <button
                        onClick={() => onEdit(tx)}
                        className="btn btn-ghost btn-sm p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        aria-label="Edit transaction"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => onDelete(tx)}
                        className="btn btn-ghost btn-sm p-1.5 text-[var(--text-muted)] hover:text-[var(--expense)]"
                        aria-label="Delete transaction"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="card sm:hidden">
        {transactions.map((tx) => <MobileCard key={tx.id} tx={tx} />)}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [slideOpen, setSlideOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SafeTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SafeTransaction | null>(null);

  // Read filters from URL
  const filters: TransactionFilters = {
    page: Number(searchParams.get("page") ?? 1),
    limit: 20,
    sort: searchParams.get("sort") ?? "-date",
    type: (searchParams.get("type") as any) ?? "",
    search: searchParams.get("search") ?? "",
    category_id: searchParams.get("category_id") ?? "",
    date_from: searchParams.get("date_from") ?? "",
    date_to: searchParams.get("date_to") ?? "",
    min_amount: searchParams.get("min_amount") ?? "",
    max_amount: searchParams.get("max_amount") ?? "",
  };

  const updateFilter = (key: keyof TransactionFilters, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      // Reset to page 1 when filters change
      if (key !== "page") next.set("page", "1");
      return next;
    });
  };

  const { data, isLoading, error, refetch } = useGetTransactionsQuery(filters);
  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation();
  const { data: categories = [] } = useGetCategoriesQuery();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTransaction(deleteTarget.id).unwrap();
      toast.success("Transaction deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractApiError(err));
      setDeleteTarget(null);
    }
  };

  const handleEdit = (tx: SafeTransaction) => {
    setEditTarget(tx);
    setSlideOpen(true);
  };

  const handleSlideClose = () => {
    setSlideOpen(false);
    setEditTarget(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Transactions</h1>
          {data && (
            <p className="text-sm text-[var(--text-muted)]">
              {data.pagination.total} transaction{data.pagination.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => { setEditTarget(null); setSlideOpen(true); }}
          className="btn btn-primary btn-sm gap-1.5"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={(key, value) => updateFilter(key as any, value)}
      />

      {/* Error */}
      {error && <ErrorState message="Failed to load transactions." onRetry={refetch} />}

      {/* Table */}
      {!error && (
        <TransactionTable
          transactions={data?.transactions ?? []}
          isLoading={isLoading}
          sort={filters.sort ?? "-date"}
          onSort={(s) => updateFilter("sort", s)}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          categories={categories}
        />
      )}

      {/* Pagination */}
      {data?.pagination && (
        <Pagination
          pagination={data.pagination}
          onPageChange={(p) => updateFilter("page", String(p))}
          disabled={isLoading}
        />
      )}

      {/* Add/Edit slide-over */}
      <SlideOver
        isOpen={slideOpen}
        onClose={handleSlideClose}
        title={editTarget ? "Edit Transaction" : "New Transaction"}
      >
        <TransactionForm
          initial={editTarget}
          onSuccess={handleSlideClose}
          onCancel={handleSlideClose}
        />
      </SlideOver>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Transaction"
        message={`Delete this ${deleteTarget?.type} of ${deleteTarget?.amount}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
