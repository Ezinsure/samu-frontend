"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--samu-border)",
  background: "var(--samu-surface)",
  color: "var(--samu-foreground)",
  fontSize: 12,
};

interface ConfirmationTrendProps {
  data: Array<{ month: string; rate: number; confirmed: number; total: number }>;
}

export function ConfirmationRateTrendChart({ data }: ConfirmationTrendProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-foreground-secondary">
        No confirmation data for this date range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--samu-border)" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, name) => {
            if (name === "rate") return [`${value}%`, "Confirmation rate"];
            return [value, name];
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="rate"
          name="Confirmation rate"
          stroke="#16A34A"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface LeaderboardBarProps {
  data: Array<{ name: string; compliancePercent: number; visits: number }>;
}

export function LeaderboardBarChart({ data }: LeaderboardBarProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-foreground-secondary">
        No coordinator performance data for this filter set.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--samu-border)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [`${value}%`, "Compliance"]}
        />
        <Bar dataKey="compliancePercent" fill="#2563EB" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
