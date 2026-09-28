import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useGetDashboardSummaryQuery } from "@/features/dashboard/dashboardApiSlice";
import { useGetTrendQuery } from "@/features/analytics/analyticsApiSlice";
import { useGetCategoriesQuery } from "@/features/categories/categoriesApiSlice";
import { useCurrency } from "@/hooks/useCurrency";
import { formatDate, formatMonthLabel } from "@/utils/format";
import { getCategoryColor } from "@/utils/categoryColors";
import {
  StatCardSkeleton,
  ChartSkeleton,
  ListItemSkeleton,
} from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/Alert";
import type { RecentTransactionItem, CategorySnapshotItem } from "@/types";

// Animated counter
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  return <span className="tabular-nums">{format(value)}</span>;
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}) {
  const { format } = useCurrency();
  return (
    <div className="stat-card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-[var(--radius)] flex items-center justify-center shrink-0 ${bgClass}`}>
        <Icon size={18} className={colorClass} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)] font-medium">{label}</p>
        <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums mt-0.5 leading-tight">
          {format(value)}
        </p>
      </div>
    </div>
  );
}

function RecentTransactionRow({
  tx,
  categories,
}: {
  tx: RecentTransactionItem;
  categories: Array<{ id: string; color: string | null }>;
}) {
  const { format } = useCurrency();
  const cat = categories.find((c) => c.id === tx.categoryId);
  const color = getCategoryColor(tx.categoryId, cat?.color ?? null);

  return (
    <Link
      to={`/transactions/${tx.id}`}
      className="flex items-center gap-3 py-2.5 px-4 hover:bg-[var(--bg-surface-2)] transition-colors rounded-[var(--radius)]"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {tx.categoryName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          {tx.description || tx.categoryName}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {tx.categoryName} · {formatDate(tx.transactionDate)}
        </p>
      </div>
      <span
        className={`text-sm font-semibold tabular-nums shrink-0 ${
          tx.type === "income" ? "amount-income" : "amount-expense"
        }`}
      >
        {tx.type === "income" ? "+" : "-"}
        {format(tx.amount)}
      </span>
    </Link>
  );
}

function CategoryBar({
  item,
  categories,
  maxAmount,
}: {
  item: CategorySnapshotItem;
  categories: Array<{ id: string; color: string | null }>;
  maxAmount: number;
}) {
  const { format } = useCurrency();
  const cat = categories.find((c) => c.id === item.categoryId);
  const color = getCategoryColor(item.categoryId, cat?.color ?? null);
  const pct = maxAmount > 0 ? (item.totalAmount / maxAmount) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-[var(--text-secondary)] font-medium truncate max-w-[140px]">
            {item.categoryName}
          </span>
        </div>
        <span className="text-[var(--text-primary)] font-semibold tabular-nums">
          {format(item.totalAmount)}
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        />
      </div>
    </div>
  );
}

function TrendChartTooltip({ active, payload, label }: any) {
  const { format } = useCurrency();
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-box">
      <p className="font-semibold text-xs mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[var(--text-muted)] capitalize">{entry.name}:</span>
          <span className="font-medium">{format(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { format } = useCurrency();
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useGetDashboardSummaryQuery();

  const {
    data: trend,
    isLoading: trendLoading,
    error: trendError,
  } = useGetTrendQuery({ months: 6 });

  const { data: categories = [] } = useGetCategoriesQuery();

  const trendData = trend?.map((t) => ({
    ...t,
    month: formatMonthLabel(t.month),
  }));

  const expenseSnapshot = summary?.categorySnapshot
    .filter((c) => c.type === "expense")
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5) ?? [];

  const maxExpense = expenseSnapshot[0]?.totalAmount ?? 1;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Your financial overview</p>
        </div>
        <Link to="/transactions" className="btn btn-primary btn-sm gap-1.5">
          <PlusCircle size={13} />
          Add Transaction
        </Link>
      </div>

      {summaryError && (
        <ErrorState
          message="Failed to load dashboard data."
          onRetry={refetchSummary}
        />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : summary ? (
          <>
            <StatCard
              label="Balance"
              value={summary.balance}
              icon={Wallet}
              colorClass="text-[var(--accent)]"
              bgClass="bg-[var(--accent-light)]"
            />
            <StatCard
              label="Total Income"
              value={summary.income}
              icon={TrendingUp}
              colorClass="text-[var(--income)]"
              bgClass="bg-[var(--income-bg)]"
            />
            <StatCard
              label="Total Expenses"
              value={summary.expense}
              icon={TrendingDown}
              colorClass="text-[var(--expense)]"
              bgClass="bg-[var(--expense-bg)]"
            />
          </>
        ) : null}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart — takes 2 cols */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                6-Month Trend
              </h2>
              <p className="text-xs text-[var(--text-muted)]">Net income vs expenses</p>
            </div>
          </div>

          {trendLoading ? (
            <div className="h-52 flex items-end gap-2 pb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton flex-1 rounded"
                  style={{ height: `${30 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          ) : trendError ? (
            <div className="h-52 flex items-center justify-center">
              <p className="text-sm text-[var(--text-muted)]">Unable to load chart data</p>
            </div>
          ) : !trendData?.length ||
            trendData.every((t) => t.income === 0 && t.expense === 0) ? (
            <div className="h-52 flex flex-col items-center justify-center text-center">
              <TrendingUp size={32} className="text-[var(--text-disabled)] mb-3" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">No trend data yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Add your first transaction to see your financial trend
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={208}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--income)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--income)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--expense)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--expense)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => format(v).replace(/\.00$/, "")}
                  width={65}
                />
                <Tooltip content={<TrendChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="var(--income)"
                  strokeWidth={2}
                  fill="url(#incomeGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="var(--expense)"
                  strokeWidth={2}
                  fill="url(#expenseGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category snapshot */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Top Expense Categories
          </h2>
          {summaryLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="skeleton h-3 w-28" />
                    <div className="skeleton h-3 w-16" />
                  </div>
                  <div className="skeleton h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : expenseSnapshot.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-sm text-[var(--text-muted)]">No expense data</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Add expenses to see categories
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenseSnapshot.map((item) => (
                <CategoryBar
                  key={item.categoryId}
                  item={item}
                  categories={categories}
                  maxAmount={maxExpense}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Recent Transactions
          </h2>
          <Link
            to="/transactions"
            className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-medium"
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>
        <div className="p-2">
          {summaryLoading ? (
            Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)
          ) : summary?.recentTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                No transactions yet
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Add your first transaction to start tracking your finances
              </p>
              <Link to="/transactions" className="btn btn-primary btn-sm mt-4 gap-1.5">
                <PlusCircle size={13} />
                Add Transaction
              </Link>
            </div>
          ) : (
            summary?.recentTransactions.map((tx) => (
              <RecentTransactionRow key={tx.id} tx={tx} categories={categories} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
