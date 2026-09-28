import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/features/categories/categoriesApiSlice";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/Alert";
import { getCategoryColor, isValidHexColor, FALLBACK_PALETTE } from "@/utils/categoryColors";
import { extractApiError } from "@/utils/format";
import type { SafeCategory } from "@/types";

// ── Schemas ──────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Max 100 chars"),
  type: z.enum(["income", "expense"]),
  color: z
    .string()
    .optional()
    .refine((v) => !v || isValidHexColor(v), "Enter a valid #rrggbb hex color"),
});

const editSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Max 100 chars"),
  color: z
    .string()
    .optional()
    .refine((v) => !v || isValidHexColor(v), "Enter a valid #rrggbb hex color"),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

// ── Color Picker ──────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {FALLBACK_PALETTE.slice(0, 12).map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              value === color
                ? "border-[var(--text-primary)] scale-110"
                : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#0ea5a0"}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-[var(--border)] bg-transparent"
          title="Custom color"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-base flex-1 font-mono text-xs"
          placeholder="#1a2b3c"
          maxLength={7}
        />
        {value && (
          <div
            className="w-7 h-7 rounded border border-[var(--border)] shrink-0"
            style={{ backgroundColor: isValidHexColor(value) ? value : "transparent" }}
          />
        )}
      </div>
    </div>
  );
}

// ── Create Modal ──────────────────────────────────────────────

function CreateCategoryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [create, { isLoading }] = useCreateCategoryMutation();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<CreateForm>({ resolver: zodResolver(createSchema), defaultValues: { type: "expense", color: "#0ea5a0" } });

  const watchedColor = watch("color") ?? "";

  const onSubmit = async (data: CreateForm) => {
    try {
      await create({ name: data.name, type: data.type, color: data.color || undefined }).unwrap();
      toast.success(`Category "${data.name}" created`);
      reset();
      onClose();
    } catch (err) {
      if ((err as any)?.status === 409) {
        toast.error("A category with this name already exists for this type.");
      } else {
        toast.error(extractApiError(err));
      }
    }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Category">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Category name
          </label>
          <input
            className="input-base"
            placeholder="e.g. Subscriptions"
            {...register("name")}
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Type
          </label>
          <select className="input-base" {...register("type")}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Color
          </label>
          <ColorPicker value={watchedColor} onChange={(v) => setValue("color", v)} />
          {errors.color && <p className="field-error">{errors.color.message}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={handleClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn btn-primary flex-1">
            {isLoading ? "Creating..." : "Create Category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Modal ────────────────────────────────────────────────

function EditCategoryModal({
  category,
  onClose,
}: {
  category: SafeCategory | null;
  onClose: () => void;
}) {
  const [update, { isLoading }] = useUpdateCategoryMutation();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<EditForm>({
      resolver: zodResolver(editSchema),
      values: category
        ? { name: category.name, color: category.color ?? "" }
        : undefined,
    });

  const watchedColor = watch("color") ?? "";

  const onSubmit = async (data: EditForm) => {
    if (!category) return;
    try {
      await update({ id: category.id, name: data.name, color: data.color || undefined }).unwrap();
      toast.success("Category updated");
      onClose();
    } catch (err) {
      if ((err as any)?.status === 409) {
        toast.error("A category with this name already exists for this type.");
      } else {
        toast.error(extractApiError(err));
      }
    }
  };

  return (
    <Modal isOpen={!!category} onClose={onClose} title="Edit Category">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Category name
          </label>
          <input className="input-base" {...register("name")} />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Type
          </label>
          <input
            className="input-base bg-[var(--bg-surface-2)] cursor-not-allowed"
            value={category?.type === "income" ? "Income" : "Expense"}
            readOnly
            disabled
          />
          <p className="field-error mt-1 text-[var(--text-muted)]">
            Category type cannot be changed after creation
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Color
          </label>
          <ColorPicker value={watchedColor} onChange={(v) => setValue("color", v)} />
          {errors.color && <p className="field-error">{errors.color.message}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn btn-primary flex-1">
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Category Card ─────────────────────────────────────────────

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: SafeCategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = getCategoryColor(category.id, category.color);

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-[var(--radius)] hover:bg-[var(--bg-surface-2)] transition-colors">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {category.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {category.name}
          </span>
          {category.isDefault && (
            <span className="badge badge-default text-[10px]">Default</span>
          )}
        </div>
        <div
          className="w-3 h-1 rounded-full mt-1"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {category.isDefault ? (
          <div
            className="flex items-center gap-1 text-xs text-[var(--text-disabled)] px-2 py-1"
            title="Default categories cannot be edited or deleted"
          >
            <Lock size={11} />
            <span className="hidden sm:inline">Protected</span>
          </div>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="btn btn-ghost btn-sm p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label={`Edit ${category.name}`}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              className="btn btn-ghost btn-sm p-1.5 text-[var(--text-muted)] hover:text-[var(--expense)]"
              aria-label={`Delete ${category.name}`}
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Category Group ────────────────────────────────────────────

function CategoryGroup({
  title,
  categories,
  badge,
  onEdit,
  onDelete,
}: {
  title: string;
  categories: SafeCategory[];
  badge: string;
  onEdit: (c: SafeCategory) => void;
  onDelete: (c: SafeCategory) => void;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
        <span
          className={`badge text-[10px] ${
            badge === "income" ? "badge-income" : "badge-expense"
          }`}
        >
          {categories.length}
        </span>
      </div>
      <div className="p-2">
        {categories.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">
            No {title.toLowerCase()} categories yet
          </p>
        ) : (
          categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={() => onEdit(cat)}
              onDelete={() => onDelete(cat)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export function CategoriesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SafeCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SafeCategory | null>(null);
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const { data: categories = [], isLoading, error, refetch } = useGetCategoriesQuery();

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id).unwrap();
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      const status = (err as any)?.status;
      if (status === 409) {
        toast.error(
          `"${deleteTarget.name}" is in use by existing transactions or budgets and cannot be deleted.`
        );
      } else if (status === 403) {
        toast.error("Default categories cannot be deleted.");
      } else {
        toast.error(extractApiError(err));
      }
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Categories</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Organize your income and expenses
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn btn-primary btn-sm gap-1.5"
        >
          <Plus size={14} />
          New Category
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton lines={5} />
          <CardSkeleton lines={5} />
        </div>
      ) : error ? (
        <ErrorState message="Failed to load categories." onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CategoryGroup
            title="Income Categories"
            categories={incomeCategories}
            badge="income"
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
          <CategoryGroup
            title="Expense Categories"
            categories={expenseCategories}
            badge="expense"
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
        <Lock size={10} />
        Default categories are protected and cannot be edited or deleted.
      </p>

      {/* Modals */}
      <CreateCategoryModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <EditCategoryModal category={editTarget} onClose={() => setEditTarget(null)} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
