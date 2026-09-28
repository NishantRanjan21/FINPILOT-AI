import React from "react";
import { AlertTriangle, RefreshCw, Info, CheckCircle, XCircle } from "lucide-react";

interface AlertProps {
  type?: "error" | "warning" | "info" | "success";
  title?: string;
  message: string;
  onRetry?: () => void;
}

const ALERT_CONFIG = {
  error: {
    icon: XCircle,
    style: "bg-[var(--error-bg)] text-[var(--error)] border-[var(--error)]",
    iconColor: "text-[var(--error)]",
  },
  warning: {
    icon: AlertTriangle,
    style: "bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]",
    iconColor: "text-[var(--warning)]",
  },
  info: {
    icon: Info,
    style: "bg-[var(--info-bg)] text-[var(--info)] border-[var(--info)]",
    iconColor: "text-[var(--info)]",
  },
  success: {
    icon: CheckCircle,
    style: "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]",
    iconColor: "text-[var(--success)]",
  },
};

export function Alert({ type = "error", title, message, onRetry }: AlertProps) {
  const cfg = ALERT_CONFIG[type];
  const Icon = cfg.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-[var(--radius)] border ${cfg.style}`}
      role="alert"
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm mb-1">{title}</p>}
        <p className="text-sm opacity-90">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-ghost btn-sm mt-2 gap-1 px-0"
          >
            <RefreshCw size={13} />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// Full-page error state
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <XCircle size={40} className="text-[var(--error)] mb-4 opacity-70" />
      <p className="text-[var(--text-secondary)] text-sm max-w-xs">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary mt-4 gap-2">
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}
