import * as React from "react";
import {
  Card,
 CardHeader,
  CardContent,
  Box,
  Typography,
  Skeleton,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { getQMSBackend } from "../../../generated/sdk/endpoints";
import { type PortfolioCategoryProjectsByStatusOut } from "../../../generated/sdk/models";

// ✅ Recharts
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

/**
 * ✅ REQUIREMENT:
 * - Always include preferred statuses, even if API returns none → show 0
 * - Still add any other statuses from API dynamically
 */
const preferred = ["New", "Active", "In progress", "On-hold", "Completed"] as const;

type ApiResponse = PortfolioCategoryProjectsByStatusOut;

const currentYear = new Date().getFullYear();

function buildYearOptions(range = 7) {
  return Array.from({ length: range }, (_, i) => currentYear - i);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n);
}

/** Normalize API status text so you don't get duplicates like IN_PROGRESS vs In progress */
function displayStatus(raw: string): string {
  if (!raw ) return "Unknown";
  const s = String(raw).trim();
  const u = s.toUpperCase().replace(/\s+/g, "_");

  if (u === "NEW") return "New";
  if (u === "ACTIVE") return "Active";
  if (u === "IN_PROGRESS") return "In progress";
  if (u === "ON_HOLD") return "On-hold";
  if (u === "COMPLETED") return "Completed";

  // mild cleanups
  if (s.toLowerCase() === "in progress") return "In progress";
  if (s.toLowerCase() === "on hold") return "On-hold";

  return s;
}

// ---------- STATUS COLORS (aligned to your Monthly Trends palette) ----------
type StatusTone = {
  gradient: string; // tailwind gradient for legend/table dot
  start: string; // gradient start (recharts)
  end: string; // gradient end (recharts)
  text: string; // tailwind text
};

const STATUS_TONES: Record<string, StatusTone> = {
  New: {
    gradient: "from-sky-500 to-indigo-600",
    start: "#0ea5e9", // sky-500
    end: "#4f46e5", // indigo-600
    text: "text-sky-600 dark:text-sky-400",
  },
  Active: {
    gradient: "from-emerald-400 to-emerald-600",
    start: "#34d399",
    end: "#059669",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  "In progress": {
    gradient: "from-blue-500 to-purple-600",
    start: "#3b82f6",
    end: "#8b5cf6",
    text: "text-blue-600 dark:text-blue-400",
  },
  "On-hold": {
    gradient: "from-amber-500 to-orange-600",
    start: "#f59e0b",
    end: "#ea580c",
    text: "text-amber-600 dark:text-amber-400",
  },
  Completed: {
    gradient: "from-violet-500 to-fuchsia-600",
    start: "#8b5cf6",
    end: "#d946ef",
    text: "text-violet-600 dark:text-violet-400",
  },
};

function hashToHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function hslToHex(h: number, s: number, l: number) {
  // s,l in [0,100]
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) (r = c), (g = x), (b = 0);
  else if (60 <= h && h < 120) (r = x), (g = c), (b = 0);
  else if (120 <= h && h < 180) (r = 0), (g = c), (b = x);
  else if (180 <= h && h < 240) (r = 0), (g = x), (b = c);
  else if (240 <= h && h < 300) (r = x), (g = 0), (b = c);
  else (r = c), (g = 0), (b = x);

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * ✅ Tone lookup:
 * - uses your known mapping for preferred statuses
 * - for any new status from API, generates a deterministic gradient (so it stays consistent)
 */
function getStatusTone(status: string): StatusTone {
  const normalized = displayStatus(status);
  const known = STATUS_TONES[normalized];
  if (known) return known;

  const hue = hashToHue(normalized);
  const start = hslToHex(hue, 85, 55);
  const end = hslToHex((hue + 35) % 360, 85, 45);
  return {
    gradient: "from-slate-500 to-slate-700", // legend dot will still be nice; gradient is mainly for dot, not required
    start,
    end,
    text: "text-slate-600 dark:text-slate-300",
  };
}

function LegendPill({ label, gradient }: { label: string; gradient: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full bg-gradient-to-br ${gradient}`} />
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
    </div>
  );
}

function safeKey(label: string) {
  return `s_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

/**
 * ✅ Normalization that:
 * 1) Always includes preferred statuses
 * 2) Adds any extra statuses from API/categories
 * 3) Zero-fills missing statuses per category
 */
function normalize(input: ApiResponse): {
  year: number;
  labels: string[];
  statuses: string[];
  matrix: Record<string, number[]>;
} {
  const year: number = input?.year ?? currentYear;
  const categories = (input?.categories ?? []) as Array<any>;

  const labels: string[] = categories.map((c) =>
    String(c?.name ?? c?.category ?? c?.label ?? "")
  );

  const statusesSet = new Set<string>();

  // (A) ALWAYS include preferred (in this order)
  preferred.forEach((s) => statusesSet.add(s));

  // (B) include statuses list from API if present
  const apiStatusesRaw: string[] = Array.isArray((input as any)?.statuses) ? (input as any).statuses : [];
  apiStatusesRaw.map(displayStatus).forEach((s) => statusesSet.add(s));

  // (C) include any statuses found in category maps
  for (const c of categories) {
    const map = c?.countsByStatus ?? c?.counts ?? c?.statusCounts ?? {};
    Object.keys(map || {}).map(displayStatus).forEach((s) => statusesSet.add(s));
  }

  // Build final statuses: preferred first, then extras sorted
  const extras = Array.from(statusesSet).filter((s) => !(preferred as readonly string[]).includes(s));
  extras.sort((a, b) => a.localeCompare(b));
  const statuses = [...preferred, ...extras];

  // Matrix init
  const matrix: Record<string, number[]> = {};
  statuses.forEach((s) => (matrix[s] = []));

  // Fill matrix with zero defaults
  for (const c of categories) {
    const map = c?.countsByStatus ?? c?.counts ?? c?.statusCounts ?? {};
    const normalizedMap: Record<string, number> = {};

    for (const [k, v] of Object.entries(map || {})) {
      normalizedMap[displayStatus(String(k))] = Number(v ?? 0);
    }

    for (const s of statuses) {
      matrix[s].push(Number(normalizedMap[s] ?? 0)); // ✅ missing -> 0
    }
  }

  return { year, labels, statuses, matrix };
}

export default function PortfolioChart() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Chart slate palette to match your Tailwind text-slate-500 / dark:text-slate-400
  const chartPalette = React.useMemo(
    () =>
      isDark
        ? {
            text: "#94a3b8", // slate-400
            axis: "rgba(148,163,184,0.55)",
            grid: "rgba(148,163,184,0.22)",
            tooltipBg: "rgba(2,6,23,0.95)",
            tooltipText: "#e2e8f0",
          }
        : {
            text: "#64748b", // slate-500
            axis: "rgba(100,116,139,0.50)",
            grid: "rgba(100,116,139,0.18)",
            tooltipBg: "rgba(255,255,255,0.95)",
            tooltipText: "#0f172a",
          },
    [isDark]
  );

  const [year, setYear] = React.useState<number>(currentYear);
  const yearOptions = React.useMemo(() => buildYearOptions(7), []);

  const api = React.useMemo(() => getQMSBackend(), []);
  const query = useQuery<PortfolioCategoryProjectsByStatusOut>({
    queryKey: ["portfolio-category-projects-status", year],
    queryFn: async () => {
      const res =
        await api.portfolioanalytics_v1_get_projectsCountByPortfolioCategoryProductHouseAndStatusForAGivenYear({
          year,
        });
      return res.data as PortfolioCategoryProjectsByStatusOut;
    },
    staleTime: 30_000,
  });

  const isLoading = query.isLoading;
  const isError = Boolean(query.error);
  const data = query.data;

  const normalized = React.useMemo(() => (data ? normalize(data) : null), [data]);

  // Build Recharts data: [{ category: "Borrow", s_new:0, s_active:3, ... }, ...]
  const { chartData, statusMeta } = React.useMemo(() => {
    if (!normalized) return { chartData: [] as any[], statusMeta: [] as any[] };

    const meta = normalized.statuses.map((status) => {
      const tone = getStatusTone(status);
      const key = safeKey(status);
      const gradId = `grad_${key}`;
      return { status, key, gradId, tone };
    });

    const dataArr = normalized.labels.map((label, idx) => {
      const row: Record<string, any> = { category: label };
      for (const m of meta) {
        row[m.key] = normalized.matrix[m.status]?.[idx] ?? 0; // ✅ always exists (0 if missing)
      }
      return row;
    });

    return { chartData: dataArr, statusMeta: meta };
  }, [normalized]);

  return (
    <div className="bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50 relative">
      <Card
        elevation={0}
        variant="outlined"
        sx={{
          bgcolor: "transparent",
          backgroundImage: "none",
          border: "none",
          boxShadow: "none",
          padding: 4,
        }}
      >
        <CardHeader
          sx={{
            px: 0,
            pt: 0,
            "& .MuiCardHeader-title": { fontWeight: 800 },
            "& .MuiCardHeader-subheader": { opacity: 0.75 },
          }}
          title={
            <span className="text-slate-800 dark:text-white">
              Projects by Portfolio Category
            </span>
          }
          subheader={
            <span className="text-slate-500 dark:text-slate-400">
              Status distribution per Product House category
            </span>
          }
          action={
            <div className="flex items-center gap-3">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        <CardContent sx={{ px: 0, pb: 0 }}>
          {isLoading && (
            <Box>
              <Skeleton
                variant="rectangular"
                height={260}
                sx={{
                  borderRadius: 2,
                  bgcolor: isDark ? "rgba(148,163,184,0.15)" : "rgba(15,23,42,0.06)",
                }}
              />
              <Box mt={2}>
                <Skeleton
                  variant="rectangular"
                  height={180}
                  sx={{
                    borderRadius: 2,
                    bgcolor: isDark ? "rgba(148,163,184,0.15)" : "rgba(15,23,42,0.06)",
                  }}
                />
              </Box>
            </Box>
          )}

          {isError && (
            <Alert
              severity="error"
              sx={{
                bgcolor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
                border: "1px solid",
                borderColor: isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.18)",
              }}
            >
              Failed to load portfolio category project stats.
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.8 }}>
                {String((query.error as any)?.message ?? "Unknown error")}
              </Typography>
            </Alert>
          )}

          {!isLoading && !isError && normalized && normalized.labels.length === 0 && (
            <Alert
              severity="info"
              sx={{
                bgcolor: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)",
                border: "1px solid",
                borderColor: isDark ? "rgba(59,130,246,0.25)" : "rgba(59,130,246,0.18)",
              }}
            >
              No data found for {year}.
            </Alert>
          )}

          {!isLoading && !isError && normalized && normalized.labels.length > 0 && (
            <Box>
              {/* ✅ Legend includes preferred statuses ALWAYS (even if all zeros) */}
              <div className="flex items-center gap-6 mb-4 flex-wrap">
                {normalized.statuses.map((s) => (
                  <LegendPill key={s} label={s} gradient={getStatusTone(s).gradient} />
                ))}
              </div>

              {/* ✅ Recharts chart */}
              <div className="h-80 text-slate-500 dark:text-slate-400">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <defs>
                      {statusMeta.map((m) => (
                        <linearGradient key={m.gradId} id={m.gradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={m.tone.start} />
                          <stop offset="100%" stopColor={m.tone.end} />
                        </linearGradient>
                      ))}
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} opacity={1} />
                    <XAxis
                      dataKey="category"
                      stroke={chartPalette.text}
                      tick={{ fill: chartPalette.text, fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: chartPalette.axis }}
                    />
                    <YAxis
                      stroke={chartPalette.text}
                      tick={{ fill: chartPalette.text, fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: chartPalette.axis }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartPalette.tooltipBg,
                        border: `1px solid ${chartPalette.axis}`,
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                        color: chartPalette.tooltipText,
                      }}
                      labelStyle={{ color: chartPalette.tooltipText }}
                      formatter={(value: any, name?: string) => [value as number, name ?? ""]}
                      labelFormatter={(label) => `Category: ${label}`}
                    />

                    {/* Grouped bars: always rendered for preferred statuses too (0 values show nothing but keep legend stable) */}
                    {statusMeta.map((m) => (
                      <Bar
                        key={m.key}
                        dataKey={m.key}
                        name={m.status}
                        fill={`url(#${m.gradId})`}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Divider sx={{ my: 2, opacity: 0.4 }} />

              {/* Table */}
              <Typography
                variant="subtitle2"
                sx={{ mb: 1 }}
                className="text-slate-700 dark:text-slate-200"
              >
                Breakdown table
              </Typography>

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  bgcolor: "transparent",
                  border: "1px solid",
                  borderColor: isDark ? "rgba(148,163,184,0.25)" : "rgba(148,163,184,0.35)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: isDark ? "rgba(2,6,23,0.35)" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      {normalized.labels.map((label) => (
                        <TableCell key={label} align="right" sx={{ fontWeight: 800 }}>
                          {label}
                        </TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody className="text-slate-500 dark:text-slate-400">
                    {normalized.statuses.map((status) => {
                      const row = normalized.matrix[status] ?? [];
                      const total = row.reduce((a, b) => a + b, 0);
                      const tone = getStatusTone(status);

                      return (
                        <TableRow key={status} hover>
                          <TableCell sx={{ fontWeight: 800 }}>
                            <span className="inline-flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${tone.gradient}`} />
                              <span className={tone.text}>{status}</span>
                            </span>
                          </TableCell>

                          {row.map((v, idx) => (
                            <TableCell key={`${status}-${idx}`} align="right" className="text-slate-500 dark:text-slate-400" sx={{color:"grey"}}>
                              {formatNumber(v)}
                            </TableCell>
                          ))}

                          <TableCell align="right" sx={{ fontWeight: 900, color:"grey" }} className="text-slate-500 dark:text-slate-400">
                            {formatNumber(total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Column totals */}
                    <TableRow
                      sx={{
                        bgcolor: isDark ? "rgba(2,6,23,0.35)" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 900 }} className="text-slate-500 dark:text-slate-400">
                        Total
                      </TableCell>
                      {normalized.labels.map((_, colIdx) => {
                        const colTotal = normalized.statuses.reduce(
                          (sum, s) => sum + (normalized.matrix[s]?.[colIdx] ?? 0),
                          0
                        );
                        return (
                          <TableCell key={`col-total-${colIdx}`} align="right" sx={{ fontWeight: 900 }} className="text-slate-500 dark:text-slate-400">
                            {formatNumber(colTotal)}
                          </TableCell>
                        );
                      })}
                      <TableCell align="right" sx={{ fontWeight: 900 }} className="text-slate-500 dark:text-slate-400">
                        {formatNumber(
                          normalized.statuses.reduce(
                            (sum, s) => sum + (normalized.matrix[s]?.reduce((a, b) => a + b, 0) ?? 0),
                            0
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography
                variant="caption"
                sx={{ display: "block", mt: 1, opacity: 0.75 }}
                className="text-slate-500 dark:text-slate-400"
              >
                Year filter affects both chart and table.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

