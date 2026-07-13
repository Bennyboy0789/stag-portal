"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Chart hue validated against the dark surface (#131317) with the dataviz
// palette checker: #d97706 passes lightness band, chroma and contrast.
const LINE = "#d97706";

function formatTick(value: string): string {
  const date = new Date(value + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

interface Point {
  date: string;
  clicks: number;
  impressions: number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: Point }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{formatTick(label)}</p>
      <p className="text-muted">
        <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: LINE }} />
        Clicks <span className="ml-1 font-medium text-foreground tabular-nums">{point.clicks}</span>
      </p>
      <p className="text-muted">
        Impressions{" "}
        <span className="ml-1 font-medium text-foreground tabular-nums">
          {point.impressions.toLocaleString()}
        </span>
      </p>
    </div>
  );
}

export function ClicksChart({ data }: { data: Point[] }) {
  return (
    <div
      className="h-56 w-full"
      role="img"
      aria-label={`Click trend over ${data.length} days`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LINE} stopOpacity={0.25} />
              <stop offset="100%" stopColor={LINE} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatTick}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={32}
          />
          <YAxis
            tickFormatter={formatCount}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={52}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke={LINE}
            strokeWidth={2}
            fill="url(#clicksFill)"
            dot={false}
            activeDot={{ r: 4, fill: LINE, stroke: "var(--surface)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
