import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Check, User, Lock, Palette } from "lucide-react";
import { toast } from "sonner";
import { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation } from "@/features/user/userApiSlice";
import { setUser } from "@/store/authSlice";
import { useAppDispatch } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/Alert";
import { extractApiError } from "@/utils/format";

const CURRENCIES = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
];

// ── Profile Form ──────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  currencyPreference: z.enum(["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD"]),
});

type ProfileForm = z.infer<typeof profileSchema>;

function ProfileSection() {
  const { data: profile, isLoading, error, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile ? { fullName: profile.fullName, currencyPreference: profile.currencyPreference as any } : undefined,
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      const updated = await updateProfile({
        fullName: data.fullName,
        currencyPreference: data.currencyPreference,
      }).unwrap();
      dispatch(setUser(updated));
      toast.success("Profile updated");
      reset({ fullName: updated.fullName, currencyPreference: updated.currencyPreference as any });
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  if (isLoading) return <CardSkeleton lines={4} />;
  if (error) return <ErrorState message="Failed to load profile." onRetry={refetch} />;

  return (
    <div className="card">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--border)]">
        <User size={15} className="text-[var(--accent)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Profile</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
        {/* Full name */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Full name
          </label>
          <input
            type="text"
            className="input-base"
            autoComplete="name"
            {...register("fullName")}
          />
          {errors.fullName && <p className="field-error">{errors.fullName.message}</p>}
        </div>

        {/* Email — read only */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Email address{" "}
            <span className="text-[var(--text-muted)] font-normal">(read-only)</span>
          </label>
          <input
            type="email"
            value={profile?.email ?? ""}
            readOnly
            disabled
            className="input-base bg-[var(--bg-surface-2)] cursor-not-allowed"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Email cannot be changed.
          </p>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Currency preference
          </label>
          <select className="input-base" {...register("currencyPreference")}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.currencyPreference && (
            <p className="field-error">{errors.currencyPreference.message}</p>
          )}
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="btn btn-primary gap-1.5"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Check size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Password Form ─────────────────────────────────────────────

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/\d/, "New password must contain at least one digit"),
});

type PasswordForm = z.infer<typeof passwordSchema>;

function PasswordSection() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const newPwd = watch("newPassword", "");

  const onSubmit = async (data: PasswordForm) => {
    try {
      await changePassword(data).unwrap();
      toast.success("Password changed successfully");
      reset();
    } catch (err) {
      const status = (err as any)?.status;
      if (status === 400) {
        const msg = (err as any)?.data?.error?.message ?? "";
        if (msg.toLowerCase().includes("current")) {
          toast.error("Current password is incorrect.");
        } else {
          toast.error(msg || extractApiError(err));
        }
      } else {
        toast.error(extractApiError(err));
      }
    }
  };

  const PasswordChecks = () => {
    if (!newPwd) return null;
    const checks = [
      { label: "8+ characters", met: newPwd.length >= 8 },
      { label: "Contains a number", met: /\d/.test(newPwd) },
    ];
    return (
      <div className="mt-2 space-y-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${c.met ? "bg-[var(--income)]" : "bg-[var(--bg-surface-2)] border border-[var(--border)]"}`}>
              {c.met && <Check size={9} className="text-white" strokeWidth={3} />}
            </div>
            <span className={`text-xs ${c.met ? "text-[var(--income)]" : "text-[var(--text-muted)]"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--border)]">
        <Lock size={15} className="text-[var(--accent)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Change Password</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Current password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              className="input-base pr-10"
              {...register("currentPassword")}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            >
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.currentPassword && <p className="field-error">{errors.currentPassword.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            New password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              className="input-base pr-10"
              {...register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.newPassword ? (
            <p className="field-error">{errors.newPassword.message}</p>
          ) : (
            <PasswordChecks />
          )}
        </div>

        <div className="pt-1">
          <button type="submit" disabled={isLoading} className="btn btn-primary gap-1.5">
            {isLoading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Theme Section ─────────────────────────────────────────────

function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="card">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--border)]">
        <Palette size={15} className="text-[var(--accent)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Appearance</h2>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`relative p-4 rounded-[var(--radius-md)] border-2 text-left transition-all ${
                theme === t
                  ? "border-[var(--accent)] bg-[var(--accent-light)]"
                  : "border-[var(--border)] hover:border-[var(--border-strong)]"
              }`}
            >
              {/* Mini preview */}
              <div className={`w-full h-16 rounded mb-3 flex flex-col gap-1.5 p-2 ${t === "dark" ? "bg-[#0d0f14]" : "bg-[#f7f8fa]"}`}>
                <div className={`h-2 w-12 rounded ${t === "dark" ? "bg-[#1c1f29]" : "bg-white"}`} />
                <div className={`h-1.5 w-8 rounded ${t === "dark" ? "bg-[#262a38]" : "bg-[#e2e5ea]"}`} />
                <div className={`h-1.5 w-10 rounded ${t === "dark" ? "bg-[#262a38]" : "bg-[#e2e5ea]"}`} />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] capitalize">{t} Mode</p>
              {theme === t && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Theme preference is saved to your account and persists across sessions.
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export function SettingsPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage your account and preferences</p>
      </div>

      <ProfileSection />
      <ThemeSection />
      <PasswordSection />
    </div>
  );
}
