import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useGetTransactionByIdQuery,
  useDeleteTransactionMutation,
} from "@/features/transactions/transactionsApiSlice";
import { useGetCategoriesQuery } from "@/features/categories/categoriesApiSlice";
import { ConfirmDialog } from "@/components/ui/Modal";
import { SlideOver } from "@/components/ui/SlideOver";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/Alert";
import { useCurrency } from "@/hooks/useCurrency";
import { formatDate, extractApiError } from "@/utils/format";
import { getCategoryColor } from "@/utils/categoryColors";

// Import the form from TransactionsPage (inlined here for simplicity)
import type { SafeTransaction } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateTransactionMutation } from "@/features/transactions/transactionsApiSlice";
import { todayString } from "@/utils/format";
import { useEffect } from "react";

const txSchema = z.object({
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Category is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0, {
      message: "Enter a valid positive amount",
    }),
  description: z.string().optional(),
  transactionDate: z
    .string()
    .min(1, "Date is required")
    .refine((v) => v <= todayString(), "Date cannot be in the future"),
});

type TxForm = z.infer<typeof txSchema>;

function EditForm({ tx, onSuccess, onCancel }: { tx: SafeTransaction; onSuccess: () => void; onCancel: () => void }) {
  const { data: categories = [] } = useGetCategoriesQuery();
  const [update, { isLoading }] = useUpdateTransactionMutation();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TxForm>({
    resolver: zodResolver(txSchema),
    defaultValues: {
      type: tx.type,
      categoryId: tx.categoryId,
      amount: String(tx.amount),
      description: tx.description ?? "",
      transactionDate: tx.transactionDate,
    },
  });

  const selectedType = watch("type");
  const filteredCategories = categories.filter((c) => c.type === selectedType);

  const onSubmit = async (data: TxForm) => {
    try {
      await update({
        id: tx.id,
        categoryId: data.categoryId,
        type: data.type,
        amount: Number(data.amount),
        description: data.description || null,
        transactionDate: data.transactionDate,
      }).unwrap();
      toast.success("Transaction updated");
      onSuccess();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(["expense", "income"] as const).map((t) => (
            <label key={t} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--radius)] border cursor-pointer text-sm font-medium transition-all ${selectedType === t ? (t === "income" ? "bg-[var(--income-bg)] text-[var(--income)] border-[var(--income)]" : "bg-[var(--expense-bg)] text-[var(--expense)] border-[var(--expense)]") : "border-[var(--border)] text-[var(--text-secondary)]"}`}>
              <input type="radio" value={t} className="sr-only" {...register("type")} />
              <span className="capitalize">{t}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Category</label>
        <select className="input-base" {...register("categoryId")}>
          <option value="">Select category</option>
          {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.categoryId && <p className="field-error">{errors.categoryId.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Amount</label>
        <input type="text" inputMode="decimal" className="input-base tabular-nums" placeholder="0.00" {...register("amount")} />
        {errors.amount && <p className="field-error">{errors.amount.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Date</label>
        <input type="date" max={todayString()} className="input-base" {...register("transactionDate")} />
        {errors.transactionDate && <p className="field-error">{errors.transactionDate.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
        <input type="text" className="input-base" {...register("description")} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary flex-1" disabled={isLoading}>Cancel</button>
        <button type="submit" disabled={isLoading} className="btn btn-primary flex-1">{isLoading ? "Saving..." : "Save Changes"}</button>
      </div>
    </form>
  );
}

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { format } = useCurrency();

  const { data: tx, isLoading, error, refetch } = useGetTransactionByIdQuery(id ?? "", { skip: !id });
  const { data: categories = [] } = useGetCategoriesQuery();
  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation();

  if (!id) return <Navigate to="/transactions" replace />;

  const category = categories.find((c) => c.id === tx?.categoryId);
  const color = tx ? getCategoryColor(tx.categoryId, category?.color ?? null) : "#ccc";

  const handleDelete = async () => {
    if (!tx) return;
    try {
      await deleteTransaction(tx.id).unwrap();
      toast.success("Transaction deleted");
      navigate("/transactions");
    } catch (err) {
      toast.error(extractApiError(err));
      setConfirmDelete(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      {/* Back */}
      <Link
        to="/transactions"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Transactions
      </Link>

      {isLoading && (
        <div className="card p-6 space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      )}

      {error && (
        <ErrorState
          message={
            (error as any)?.status === 404
              ? "Transaction not found."
              : "Failed to load transaction."
          }
          onRetry={refetch}
        />
      )}

      {tx && (
        <div className="card overflow-hidden">
          {/* Header band */}
          <div
            className="px-6 py-8 flex items-center gap-4"
            style={{ backgroundColor: color + "22" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {category?.name.charAt(0) ?? "?"}
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mb-1">
                {tx.type}
              </p>
              <p
                className={`text-3xl font-bold tabular-nums ${
                  tx.type === "income" ? "amount-income" : "amount-expense"
                }`}
              >
                {tx.type === "income" ? "+" : "-"}{format(tx.amount)}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <DetailRow label="Description" value={tx.description || "—"} />
            <DetailRow label="Category" value={category?.name ?? "Unknown"} />
            <DetailRow label="Date" value={formatDate(tx.transactionDate)} />
            <DetailRow label="Created" value={formatDate(String(tx.createdAt).split("T")[0])} />
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => setEditOpen(true)}
              className="btn btn-secondary flex-1 gap-2"
            >
              <Pencil size={14} />
              Edit
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn btn-danger gap-2"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Edit slideover */}
      <SlideOver
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Transaction"
      >
        {tx && (
          <EditForm
            tx={tx}
            onSuccess={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        )}
      </SlideOver>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-[var(--text-primary)] font-medium text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const nav = useNavigate();
  useEffect(() => { nav(to, { replace }); }, []);
  return null;
}
