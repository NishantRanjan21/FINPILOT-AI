import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  useGetMonthlySummaryQuery,
  useGetCategoryBreakdownQuery,
  useGetTrendQuery,
} from "@/features/analytics/analyticsApiSlice";
import { useGetCategoriesQuery } from "@/features/categories/categoriesApiSlice";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/Alert";
import { useCurrency } from "@/hooks/useCurrency";
import { formatMonthLabel, firstDayOfMonth, lastDayOfMonth, todayString } from "@/utils/format";
import { getCategoryColor } from "@/utils/categoryColors";
import { currentYearMonth } from "@/utils/format";
import { BarChart3, TrendingUp } from "lucide-react";

// ── Date Range Presets ────────────────────────────────────────

type PresetKey = "this-month" | "last-3" | "last-6" | "ytd" | "custom";

function getPresetRange(preset: PresetKey): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = todayString();

  switch (preset) {
    case "this-month":
      return { from: firstDayOfMonth(year, month), to: today };
    case "last-3": {
      const d = new Date(year, month - 4, 1);
      return { from: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`, to: today };
    }
    case "last-6": {
      const d = new Date(year, month - 7, 1);
      return { from: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`, to: today };
    }
    case "ytd":
      return { from: `${year}-01-01`, to: today };
    default:
      return { from: "", to: "" };
  }
}

function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  preset,
  onPresetChange,
}: {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  preset: PresetKey;
  onPresetChange: (p: PresetKey) => void;
}) {
  const presets: { key: PresetKey; label: string }[] = [
    { key: "this-month", label: "This Month" },
    { key: "last-3", label: "Last 3 Months" },
    { key: "last-6", label: "Last 6 Months" },
    { key: "ytd", label: "Year to Date" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <button
          key={p.key}
          onClick={() => onPresetChange(p.key)}
          className={`btn btn-sm ${preset === p.key ? "btn-primary" : "btn-secondary"}`}
        >
          {p.label}
        </button>
      ))}
      {preset === "custom" && (
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="input-base w-auto"
            max={to || todayString()}
          />
          <span className="text-[var(--text-muted)] text-sm">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="input-base w-auto"
            min={from}
            max={todayString()}
          />
        </div>
      )}
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  const { format } = useCurrency();
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-box">
      <p className="font-semibold text-xs mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs my-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-[var(--text-muted)] capitalize">{entry.name}:</span>
          <span className="font-semibold tabular-nums">{format(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  const { format } = useCurrency();
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="tooltip-box">
      <p className="font-semibold text-xs">{entry.name}</p>
      <p className="text-xs tabular-nums mt-1">{format(entry.value)}</p>
    </div>
  );
}

// ── Monthly Summary Chart ─────────────────────────────────────

function MonthlySummaryChart({ from, to }: { from: string; to: string }) {
  const { format } = useCurrency();
  const { data, isLoading, error } = useGetMonthlySummaryQuery({ from: from || undefined, to: to || undefined });

  const chartData = data?.map((d) => ({ ...d, month: formatMonthLabel(d.month) })) ?? [];

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Income vs Expenses</h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">Monthly comparison for selected period</p>

      {isLoading ? (
        <div className="h-64 flex items-end gap-2 pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton flex-1 rounded" style={{ height: `${30 + i * 10}%` }} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message="Failed to load monthly summary." />
      ) : chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <BarChart3 size={32} className="text-[var(--text-disabled)] mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">No data for this period</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Add transactions to see monthly comparisons</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={256}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => format(v).replace(/\.00$/, "")}
              width={70}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="income" name="Income" fill="var(--income)" radius={[3, 3, 0, 0]} maxBarSize={32} />
            <Bar dataKey="expense" name="Expense" fill="var(--expense)" radius={[3, 3, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Category Breakdown Chart ──────────────────────────────────

function CategoryBreakdownChart({
  from,
  to,
  categories,
}: {
  from: string;
  to: string;
  categories: Array<{ id: string; color: string | null; name: string }>;
}) {
  const { format } = useCurrency();
  const { data, isLoading, error } = useGetCategoryBreakdownQuery({ from: from || undefined, to: to || undefined });

  const expenseData = data
    ?.filter((d) => d.type === "expense")
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 8) ?? [];

  const incomeData = data
    ?.filter((d) => d.type === "income")
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 8) ?? [];

  const renderChart = (items: typeof expenseData, label: string) => {
    if (items.length === 0)
      return (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-[var(--text-muted)]">No {label.toLowerCase()} data</p>
        </div>
      );

    const pieData = items.map((d) => ({
      name: d.categoryName,
      value: d.totalAmount,
      color: getCategoryColor(d.categoryId, categories.find((c) => c.id === d.categoryId)?.color ?? null),
    }));

    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-[var(--text-secondary)]">{value}</span>
            )}
            iconSize={8}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {["Expense", "Income"].map((type) => (
        <div key={type} className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            {type} Breakdown
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">By category for selected period</p>
          {isLoading ? (
            <div className="h-48 flex items-end gap-2 pb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton flex-1 rounded" style={{ height: `${30 + i * 12}%` }} />
              ))}
            </div>
          ) : error ? (
            <ErrorState message="Failed to load category data." />
          ) : (
            renderChart(type === "Expense" ? expenseData : incomeData, type)
          )}
        </div>
      ))}
    </div>
  );
}

// ── Trend Chart ───────────────────────────────────────────────

function TrendChart() {
  const { format } = useCurrency();
  const [months, setMonths] = useState<3 | 6 | 12>(6);
  const { data, isLoading, error } = useGetTrendQuery({ months });

  const chartData = data?.map((d) => ({ ...d, month: formatMonthLabel(d.month) })) ?? [];

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Financial Trend</h2>
          <p className="text-xs text-[var(--text-muted)]">Net savings over time</p>
        </div>
        <div className="flex gap-1">
          {([3, 6, 12] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`btn btn-sm px-2 text-xs ${months === m ? "btn-primary" : "btn-ghost"}`}
            >
              {m}M
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-end gap-2 pb-4">
          {Array.from({ length: months }).map((_, i) => (
            <div key={i} className="skeleton flex-1 rounded" style={{ height: `${30 + Math.random() * 50}%` }} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message="Failed to load trend data." />
      ) : !chartData.length || chartData.every((d) => d.net === 0 && d.income === 0) ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <TrendingUp size={32} className="text-[var(--text-disabled)] mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">No trend data yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Add transactions to see your trend</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={256}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => format(v).replace(/\.00$/, "")}
              width={70}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="4 2" />
            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="var(--income)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--income)" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Expense"
              stroke="var(--expense)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--expense)" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="net"
              name="Net"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--accent)" }}
              activeDot={{ r: 5 }}
              strokeDasharray="6 2"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 justify-center">
        {[
          { color: "var(--income)", label: "Income" },
          { color: "var(--expense)", label: "Expense" },
          { color: "var(--accent)", label: "Net" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export function AnalyticsPage() {
  const [preset, setPreset] = useState<PresetKey>("last-6");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { data: categories = [] } = useGetCategoriesQuery();

  const { from, to } = preset === "custom"
    ? { from: customFrom, to: customTo }
    : getPresetRange(preset);

  const handlePresetChange = (p: PresetKey) => {
    setPreset(p);
    if (p !== "custom") {
      setCustomFrom("");
      setCustomTo("");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Analytics</h1>
        <p className="text-sm text-[var(--text-muted)]">Deep insights into your financial patterns</p>
      </div>

      {/* Date range picker */}
      <div className="card p-4">
        <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Time period</p>
        <DateRangePicker
          from={customFrom}
          to={customTo}
          onFromChange={setCustomFrom}
          onToChange={setCustomTo}
          preset={preset}
          onPresetChange={handlePresetChange}
        />
      </div>

      {/* Monthly summary */}
      <MonthlySummaryChart from={from} to={to} />

      {/* Category breakdown */}
      <CategoryBreakdownChart from={from} to={to} categories={categories} />

      {/* Trend */}
      <TrendChart />
    </div>
  );
}
