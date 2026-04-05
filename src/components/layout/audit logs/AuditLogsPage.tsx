import * as React from "react";
import {
  Box,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Chip,
  Drawer,
  useMediaQuery,
  Button,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import { darkText, darkInput } from "../../common/T-colors";
import { useAuditLogs, useAuditLogDetail } from "./useAuditLogs";
import type { ActivityLogOut } from "../../../generated/sdk/models";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function OutcomeChip({ outcome }: { outcome?: string | null }) {
  const val = (outcome ?? "").toLowerCase();

  if (!val) {
    return <Chip size="small" label="Unknown" variant="outlined" />;
  }

  const isFail = val === "failed";
  return (
    <Chip
      size="small"
      icon={isFail ? <ErrorOutlineIcon /> : <CheckCircleOutlineIcon />}
      label={isFail ? "Failed" : "Success"}
      color={isFail ? "error" : "success"}
      variant="outlined"
    />
  );
}

function JsonBlock({ value }: { value: any }) {
  return (
    <Box
      component="pre"
      className="text-[rgb(var(--subtle))] bg-[rgb(var(--bg))] border border-slate-200/60 dark:border-slate-700/60 rounded-lg p-3 overflow-auto text-xs"
      sx={{ maxHeight: 280 }}
    >
      {JSON.stringify(value ?? {}, null, 2)}
    </Box>
  );
}

// Optional: debounce search input (prevents spam calls)
function useDebounced<T>(value: T, delayMs = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function AuditLogsPage() {
  // ---- UI state ----
  const [q, setQ] = React.useState("");
  const [entityType, setEntityType] = React.useState<string>("");
  const [outcome, setOutcome] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  // org_id: wire from auth/tenant context (leave undefined if not required)
  const org_id = undefined as number | undefined;

  const isSmall = useMediaQuery("(max-width:900px)");

  const qDebounced = useDebounced(q, 350);

  const auditQuery = useAuditLogs({
    org_id,
    q: qDebounced,
    entity_type: entityType || undefined,
    outcome: outcome || undefined,
    page,
    page_size: pageSize,
  });

  const { data, isLoading, isFetching, error, refetch } = auditQuery;

  const detail = useAuditLogDetail(selectedId, org_id);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // layout widths
  const showPanel = !!selectedId && !isSmall;
  const leftWidth = showPanel ? "75%" : "100%";

  // If filter changes shrink total pages, clamp page
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  // Optional: close details if selected row no longer in current filter/page
  React.useEffect(() => {
    if (!selectedId) return;
    const exists = items.some((x) => Number(x.id) === selectedId);
    if (!exists && !isFetching) {
      // keep open if you want; but if you prefer auto-close on page change:
      // setSelectedId(null);
    }
  }, [items, selectedId, isFetching]);

  return (
    <Box className="w-full min-h-screen p-6 text-[rgb(var(--subtle))]"  sx={{
        p: 2,
        borderRadius: 2,
    color: 'rgb(var(--subtle))',      
    bgcolor: 'rgb(var(--bg))',           
    backdropFilter: 'blur(24px)',                

      }}>
      <Box className="flex items-start justify-between gap-3">
        <Box>
          <Typography variant="h5" className="text-[rgb(var(--text))] font-semibold">
            Audit logging
          </Typography>

          <Typography variant="body2" className="text-[rgb(var(--subtle))] mt-1">
            Search and review system activity logs (create/update events, outcomes, and error context).
          </Typography>
        </Box>

        <Tooltip title="Refresh">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Filters */}
      <Box className="mt-4 flex gap-3 items-center flex-wrap">
        <TextField
          size="small"
          placeholder="Search audit logs (title, actor, request id)"
          sx={[darkInput, { width: 350 }]}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className="min-w-[320px]"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          size="small"
          sx={[darkInput, { width: 120 }]}
          label="Entity type"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="project">Project</MenuItem>
          <MenuItem value="program">Program</MenuItem>
          <MenuItem value="portfolio">Portfolio</MenuItem>
          <MenuItem value="user">User</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Outcome"
          sx={[darkInput, { width: 120 }]}
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value);
            setPage(1);
          }}
          
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="success">success</MenuItem>
          <MenuItem value="failed">failed</MenuItem>
        </TextField>

        <Box className="flex-1" />

        <Typography variant="body2" className="text-[rgb(var(--text))] flex items-center gap-2">
          {isLoading ? (
            <>
              <CircularProgress size={14} /> Loading...
            </>
          ) : isFetching ? (
            <>
              <CircularProgress size={14} /> Loading page...
            </>
          ) : (
            `${total} results`
          )}
        </Typography>
      </Box>

      <Box className="mt-4 flex gap-4" >
        {/* LEFT: TABLE */}
        <Paper
          className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-[rgb(var(--bg))] shadow-xl backdrop-blur-xl"
          sx={{ width: leftWidth, transition: "width 200ms ease", color: 'rgb(var(--subtle))', bgcolor: 'rgb(var(--bg))', backdropFilter: 'blur(24px)'}}
        >
          <Box className="p-4">
            {error ? (
              <Typography color="error">
                Failed to load audit logs: {(error as any)?.message ?? "unknown error"}
              </Typography>
            ) : (
              <>
                <Box className="grid grid-cols-12 gap-2 text-xls text-[rgb(var(--text))] px-2 pb-2">
                  <Box className="col-span-3" sx={darkText}>Actor</Box>
                  <Box className="col-span-2" sx={darkText}>Entity</Box>
                  <Box className="col-span-3" sx={darkText}>Title</Box>
                  <Box className="col-span-2" sx={darkText}>Timestamp</Box>
                  <Box className="col-span-2" sx={darkText}>Outcome</Box>
                </Box>

               
                <Divider sx={{ borderColor: "rgba(var(--divider), 0.6)" }} />

                {/* Rows */}
                <Box className="mt-2" key={`${page}-${entityType}-${outcome}-${qDebounced}`}>
                  {items.length === 0 && !isLoading ? (
                    <Typography className="text-[rgb(var(--text))] p-3" sx={darkText}>
                      No logs found for the selected filters.
                    </Typography>
                  ) : (
                    items.map((row: ActivityLogOut) => {
                      const rowId = Number(row.id);
                      const selected = rowId === selectedId;
                      const isFail = (row.outcome ?? "").toLowerCase() === "failure";

                      return (
                        <Box
                          key={String(row.id)}
                          onClick={() => setSelectedId(rowId)}
                          className={[
                            "grid grid-cols-12 gap-2 px-2 py-3 rounded-lg cursor-pointer",
                            "hover:bg-slate-100/60 dark:hover:bg-slate-800/30",
                            selected ? "bg-slate-100/70 dark:bg-slate-800/40" : "",
                            isFail ? "border border-red-300/40 dark:border-red-700/40" : "",
                          ].join(" ")}
                          
                        >
                          <Box className="col-span-3 text-sm text-[rgb(var(--text))]">
                            {row.actor_first_name ?? "System"}
                            {row.actor_id ? (
                              <span className="text-[rgb(var(--text))] text-xs ml-2">
                                #{row.actor_id}
                              </span>
                            ) : null}
                          </Box>

                          <Box className="col-span-2 text-sm">
                            <span className="text-[rgb(var(--text))]">{row.entity_type}</span>
                            <span className="text-[rgb(var(--text))] text-xs ml-2">
                              {row.entity_id}
                            </span>
                          </Box>

                          <Box className="col-span-3 text-sm text-[rgb(var(--text))] truncate">
                            {row.title}
                            <span className="text-[rgb(var(--text))] text-xs ml-2">
                              ({row.action})
                            </span>
                          </Box>

                          <Box className="col-span-2 text-sm text-[rgb(var(--text))]">
                            {fmtDate(row.created_at)}
                          </Box>

                          <Box className="col-span-2 flex items-center">
                            <OutcomeChip outcome={row.outcome} />
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>

                <Divider sx={{ borderColor: "rgba(var(--divider), 0.6)" }} />

                {/* Pagination */}
                <Box className="flex items-center justify-between mt-3">
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>

                  <Typography variant="body2" className="text-[rgb(var(--text))]">
                    Page {page} of {totalPages}
                  </Typography>

                  <Button
                    size="small"
                    variant="outlined"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Paper>

        {/* RIGHT: DETAILS (Desktop persistent panel) */}
        {showPanel ? (
          <Paper
            className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-[rgb(var(--bg))] shadow-xl backdrop-blur-xl"
         sx={{width: "25%",
    color: 'rgb(var(--subtle))',      
    bgcolor: 'rgb(var(--bg))',           
    backdropFilter: 'blur(24px)',                

      }}
          >
            <DetailPanel
              selectedId={selectedId}
              onClose={() => setSelectedId(null)}
              loading={detail.isLoading}
              error={detail.error as any}
              log={detail.data ?? null}
            />
          </Paper>
        ) : null}
      </Box>

      {/* Small screen: right panel becomes Drawer */}
      {isSmall ? (
        <Drawer
          anchor="right"
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          PaperProps={{ sx: { width: "92vw", maxWidth: 520 } }}
        >
          <Box className="p-3">
            <DetailPanel
              selectedId={selectedId}
              onClose={() => setSelectedId(null)}
              loading={detail.isLoading}
              error={detail.error as any}
              log={detail.data ?? null}
            />
          </Box>
        </Drawer>
      ) : null}
    </Box>
  );
}

function DetailPanel({
  selectedId,
  onClose,
  loading,
  error,
  log,
}: {
  selectedId: number | null;
  onClose: () => void;
  loading: boolean;
  error: any;
  log: ActivityLogOut | null;
}) {
  return (
    <Box className="p-4">
      <Box className="flex items-center justify-between mb-1">
        <Typography variant="subtitle1" className="text-xls text-[rgb(var(--text))] font-semibold " sx={darkText}>
          Log details
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" sx={darkInput}/>
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: "rgba(var(--divider), 0.6)" }} />

      {loading ? (
        <Typography className="text-[rgb(var(--text))]" sx={darkText}>Loading...</Typography>
      ) : error ? (
        <Typography color="error">
          Failed to load log #{selectedId}: {error?.message ?? "unknown error"}
        </Typography>
      ) : !log ? (
        <Typography className="text-[rgb(var(--text))]" sx={darkText}>Select a row to see details.</Typography>
      ) : (
        <Box className="space-y-3, mt-3">
          <Box>
            <Typography variant="caption" className="text-[rgb(var(--text))]" sx={darkText}>
              Title
            </Typography>
            <Typography className="text-[rgb(var(--text))]" sx={darkText}>{log.title}</Typography>
          </Box>

          <Box className="grid grid-cols-1 gap-3 mb-2">
            <Box>
              <Typography variant="caption" className="text-[rgb(var(--text))]" sx={darkText}>
                Actor
              </Typography>
              <Typography className="text-[rgb(var(--text))]" sx={darkText}>
                {log.actor_first_name ?? "System"} {log.actor_id ? `(#${log.actor_id})` : ""}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" className="text-[rgb(var(--text))]" sx={darkText}>
                Timestamp
              </Typography>
              <Typography className="text-[rgb(var(--text))]" sx={darkText}>
                {fmtDate(log.created_at)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" className="text-[rgb(var(--text))]" sx={darkText}>
                Entity
              </Typography>
              <Typography className="text-[rgb(var(--text))]" sx={darkText}>
                {log.entity_type} #{log.entity_id}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" className="text-[rgb(var(--text))]" sx={darkText}>
                Action / Outcome
              </Typography>
              <Typography className="text-[rgb(var(--text))]" sx={darkText}>
                {log.action} — {log.outcome ?? "unknown"}
              </Typography>
            </Box>
          </Box>

          {log.request_id ? (
            <Box>
              <Typography variant="caption" className="text-[rgb(var(--text))]" sx={darkText}>
                Request ID
              </Typography>
              <Typography className="text-[rgb(var(--text))]" sx={darkText}>{log.request_id}</Typography>
            </Box>
          ) : null}

          {(log.outcome ?? "").toLowerCase() === "failure" ? (
            <Box className="border border-red-300/40 dark:border-red-700/40 rounded-lg p-3">
              <Typography variant="subtitle2" className="text-red-600 dark:text-red-400">
                Failure context
              </Typography>
              <Typography variant="body2" className="text-[rgb(var(--text))] mt-1" sx={darkText}>
                {log.error_type ?? "UnknownError"}
              </Typography>
              <Typography variant="body2" className="text-[rgb(var(--text))] mt-1" sx={darkText}>
                {log.error_message ?? "No error message captured"}
              </Typography>
            </Box>
          ) : null}

          <Box>
            <Typography variant="caption" className="text-[rgb(var(--text))]" sx={darkText}>
              Metadata
            </Typography>
            <JsonBlock value={(log as any).meta}/>
          </Box>
        </Box>
      )}
    </Box>
  );
}