import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, TrendingUp, Check } from "lucide-react";
import { toast } from "sonner";
import { useRegisterMutation } from "@/features/auth/authApiSlice";
import { setUser } from "@/store/authSlice";
import { useAppDispatch } from "@/hooks/redux";
import { extractApiError } from "@/utils/format";

const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one digit"),
});

type RegisterForm = z.infer<typeof registerSchema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains a letter", met: /[a-zA-Z]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5">
          <div
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${c.met ? "bg-[var(--income)]" : "bg-[var(--bg-surface-2)] border border-[var(--border)]"
              }`}
          >
            {c.met && <Check size={9} className="text-white" strokeWidth={3} />}
          </div>
          <span
            className={`text-xs ${c.met ? "text-[var(--income)]" : "text-[var(--text-muted)]"
              }`}
          >
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [register, { isLoading }] = useRegisterMutation();

  const {
    register: rhfRegister,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data: RegisterForm) => {
    try {
      const user = await register(data).unwrap();
      dispatch(setUser(user));
      navigate("/dashboard");
    } catch (err) {
      const msg = extractApiError(err);
      if ((err as any)?.status === 409) {
        toast.error("This email is already registered. Try signing in instead.");
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--accent)] mb-4">
            <TrendingUp size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Start managing your finances with FinPilot AI
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Full name */}
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                className="input-base"
                placeholder="Guest User"
                {...rhfRegister("fullName")}
              />
              {errors.fullName && (
                <p className="field-error">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                className="input-base"
                placeholder="you@example.com"
                {...rhfRegister("email")}
              />
              {errors.email && (
                <p className="field-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="input-base pr-10"
                  placeholder="••••••••"
                  {...rhfRegister("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password ? (
                <p className="field-error">{errors.password.message}</p>
              ) : (
                <PasswordStrength password={watchedPassword} />
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg w-full mt-2"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-5">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[var(--accent)] font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
