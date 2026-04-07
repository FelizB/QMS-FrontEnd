// src/components/layout/workspaces/manage/view/PortfoliosView.tsx
import * as React from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

import type { PortfolioOut } from "../../../../../generated/sdk/models";
import { usePortfolios,useDeletePortfolio, useDeletePortfoliosBulk } from "../hooks/usePortfolios";
import { darkText,darkInput } from "../../../../common/T-colors";
import { useNavigate } from "react-router-dom";

// --- helpers ---
function boolLabel(v: boolean) {
  return v ? "Yes" : "No";
}

function mergeSx(base: any, extra: any) {
  // Avoid sx={[...]} typing issues in your project
  return (theme: any) => ({
    ...(typeof base === "function" ? base(theme) : base),
    ...(typeof extra === "function" ? extra(theme) : extra),
  });
}

function BadgeBool({ value }: { value: boolean }) {
  return (
    <Chip
      size="small"
      label={value ? "Yes" : "No"}
      color={value ? "success" : "default"}
      variant="outlined"
      sx={{
        height: 22,
        "& .MuiChip-label": { px: 1, fontSize: 12 },
      }}
    />
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Delete",
  confirmColor = "error",
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  confirmColor?: "error" | "primary" | "warning" | "success";
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog  open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle className="text-[rgb(var(--text))]">{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" className="text-[rgb(var(--subtle))]">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={!!loading}>
          Cancel
        </Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm} disabled={!!loading}>
          {loading ? <CircularProgress size={16} sx={{ color: "white" }} /> : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PortfoliosView() {
  const navigate = useNavigate();
  const isSmall = useMediaQuery("(max-width:900px)");

  // ---- paging + filters ----
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const [q, setQ] = React.useState("");
  const [defaultFilter, setDefaultFilter] = React.useState<"" | "true" | "false">("");
  const [activeFilter, setActiveFilter] = React.useState<"" | "true" | "false">("");
  const [templateFilter, setTemplateFilter] = React.useState<string[]>([]);

  // ---- selection ----
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);

  const params = {
    page,
    page_size: pageSize,
    q: q || undefined,
    is_default: defaultFilter === "" ? undefined : defaultFilter === "true",
    is_active: activeFilter === "" ? undefined : activeFilter === "true",
    templates: templateFilter.length ? templateFilter : undefined,
  };

  const { data, isLoading, isFetching, error, refetch } = usePortfolios(params);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // templates list for multiselect (from current page; replace with reference data endpoint later)
  const templateOptions = React.useMemo(() => {
    const set = new Set<string>();
    items.forEach((p) => p.template_id && set.add(p.template_id.toString()));
    return Array.from(set).sort();
  }, [items]);

  // ---- delete mutations ----
  const delOne = useDeletePortfolio();
  const delBulk = useDeletePortfoliosBulk();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmIds, setConfirmIds] = React.useState<number[]>([]);
  const confirmLoading = delOne.isPending || delBulk.isPending;

  const selectedCount = selectedIds.length;
  const canUpdate = selectedCount === 1;
  const canDelete = selectedCount >= 1;

  // Keep selection consistent if page changes
  React.useEffect(() => {
    // Optional: clear selection on page/filter changes
    setSelectedIds([]);
  }, [page, q, defaultFilter, activeFilter, templateFilter]);

  // Clamp page if filters reduce total
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(items.map((x) => x.id));
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const isSelected = (id: number) => selectedIds.includes(id);
  const allChecked = items.length > 0 && selectedIds.length === items.length;
  const someChecked = selectedIds.length > 0 && selectedIds.length < items.length;

  const openDeleteConfirm = (ids: number[]) => {
    setConfirmIds(ids);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    const ids = [...confirmIds];
    setConfirmOpen(false);

    if (ids.length === 1) {
      await delOne.mutateAsync(ids[0]);
    } else if (ids.length > 1) {
      await delBulk.mutateAsync(ids);
    }

    setSelectedIds([]);
  };

  const onEditSelected = () => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    // Navigate to edit route (create this later)
    navigate(`/workspace/manage/portfoliosView/${id}/edit`);
  };

  const onAdd = () => {
    navigate(`/workspace/manage/portfoliosView/new`);
  };

  return (
    <Box className="w-full text-[rgb(var(--subtle))]">
      {/* Header row + actions */}
      <Box className="flex items-start justify-between gap-3 flex-wrap">
        <Box>
          <Typography variant="subtitle1" className="text-[rgb(var(--text))] font-semibold">
      
          </Typography>
          <Typography variant="body2" className="text-[rgb(var(--subtle))] mt-0.5">
            Select a portfolio to update, or select multiple to delete.
          </Typography>
        </Box>

        <Box className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outlined"
            startIcon={<AddIcon fontSize="small" />}
            onClick={onAdd}
            sx={mergeSx(darkText, { textTransform: "none" })}
          >
            Add
          </Button>

          <Button
            variant="outlined"
            startIcon={<EditIcon fontSize="small" />}
            disabled={!canUpdate}
            onClick={onEditSelected}
            sx={mergeSx(darkText, { textTransform: "none" })}
          >
            Update
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon fontSize="small" />}
            disabled={!canDelete}
            onClick={() => openDeleteConfirm(selectedIds)}
            sx={mergeSx(darkText, { textTransform: "none" })}
          >
            Delete
          </Button>

          <Tooltip title="Refresh">
            <span>
              <IconButton
                size="small"
                onClick={() => refetch()}
                disabled={isLoading}
                sx={mergeSx(darkText, { border: "1px solid rgba(148,163,184,.25)", borderRadius: 2 })}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ my: 2, borderColor: "rgba(148,163,184,.25)" }} />

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: "rgb(var(--bg))",
          border: "1px solid rgba(148,163,184,.25)",
          borderRadius: 2,
        }}
        className="backdrop-blur-xl"
      >
        <Box className="grid grid-cols-12 gap-2 items-center">
          <Box className="col-span-12 md:col-span-4">
            <TextField
              size="small"
              placeholder="Search by name..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              fullWidth
              sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            />
          </Box>

          <Box className="col-span-6 md:col-span-2">
            <Select
              size="small"
              fullWidth
              value={defaultFilter}
              onChange={(e) => {
                setDefaultFilter(e.target.value as any);
                setPage(1);
              }}
              displayEmpty
              sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            >
              <MenuItem value="">Default (Any)</MenuItem>
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </Box>

          <Box className="col-span-6 md:col-span-2">
            <Select
              size="small"
              fullWidth
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value as any);
                setPage(1);
              }}
              displayEmpty
              sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            >
              <MenuItem value="">Active (Any)</MenuItem>
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </Box>

          <Box className="col-span-12 md:col-span-4">
            <Select
              size="small"
              fullWidth
              multiple
              value={templateFilter}
              onChange={(e) => {
                const val = e.target.value as string[];
                setTemplateFilter(val);
                setPage(1);
              }}
              displayEmpty
              renderValue={(selected) =>
                (selected as string[]).length ? (selected as string[]).join(", ") : "Template (Any)"
              }
              sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            >
              {templateOptions.length === 0 ? (
                <MenuItem disabled value="">
                  No templates on this page
                </MenuItem>
              ) : (
                templateOptions.map((t) => (
                  <MenuItem key={t} value={t}>
                    <Checkbox size="small" checked={templateFilter.includes(t)} />
                    <Typography variant="body2" className="text-[rgb(var(--text))]">
                      {t}
                    </Typography>
                  </MenuItem>
                ))
              )}
            </Select>
          </Box>
        </Box>
      </Paper>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          mt: 2,
          backgroundColor: "rgb(var(--bg))",
          border: "1px solid rgba(148,163,184,.25)",
          borderRadius: 2,
          overflow: "hidden",
        }}
        className="backdrop-blur-xl"
      >
        {/* table header */}
        <Box
          className="grid grid-cols-12 gap-2 px-3 py-2 text-xs"
          sx={{
            backgroundColor: "rgb(var(--bg))",
            borderBottom: "1px solid rgba(148,163,184,.25)",
            color: "rgb(var(--muted))",
            fontWeight: 700,
          }}
        >
          <Box className="col-span-1 flex items-center">
            <Checkbox
              size="small"
              checked={allChecked}
              indeterminate={someChecked}
              onChange={(e) => toggleAll(e.target.checked)}
              sx={mergeSx(darkText, {}) as any}
            />
          </Box>
          <Box className="col-span-4" sx={darkText}>Name</Box>
          <Box className="col-span-1" sx={darkText}>Default</Box>
          <Box className="col-span-1" sx={darkText}>Active</Box>
          <Box className="col-span-3" sx={darkText}>Template</Box>
          <Box className="col-span-1" sx={darkText}>ID</Box>
          <Box className="col-span-1" sx={darkText}>Operations</Box>
        </Box>

        {/* rows */}
        <Box>
          {error ? (
            <Box className="p-3">
              <Typography color="error">
                Failed to load portfolios: {(error as any)?.message ?? "unknown error"}
              </Typography>
            </Box>
          ) : isLoading ? (
            <Box className="p-6 flex items-center gap-2">
              <CircularProgress size={18} />
              <Typography className="text-[rgb(var(--muted))]">Loading...</Typography>
            </Box>
          ) : items.length === 0 ? (
            <Box className="p-6">
              <Typography className="text-[rgb(var(--muted))]">
                No portfolios found for the selected filters.
              </Typography>
            </Box>
          ) : (
            items.map((row: PortfolioOut) => {
              const selected = isSelected(row.id);

              return (
                <Box
                  key={row.id}
                  className={[
                    "grid grid-cols-12 gap-2 px-3 py-2 text-sm items-center",
                    "cursor-pointer",
                  ].join(" ")}
                  sx={{
                    backgroundColor: selected ? "rgba(99,102,241,.10)" : "rgb(var(--bg))",
                    borderBottom: "1px solid rgba(148,163,184,.18)",
                    "&:hover": { backgroundColor: selected ? "rgba(99,102,241,.14)" : "rgba(148,163,184,.10)" },
                  }}
                  onClick={() => toggleOne(row.id, !selected)}
                >
                  <Box className="col-span-1 flex items-center text-[rgb(var(--subtle))]" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      size="small"
                      checked={selected}
                      onChange={(e) => toggleOne(row.id, e.target.checked)}
                      sx={mergeSx(darkText, {}) as any}
                    />
                  </Box>

                  <Box className="col-span-4 text-[rgb(var(--subtle))] truncate">
                    {row.name}
                  </Box>

                  <Box className="col-span-1 text-[rgb(var(--subtle))]">
                    <BadgeBool value={!!row.is_default} />
                  </Box>

                  <Box className="col-span-1 text-[rgb(var(--subtle))]">
                    <BadgeBool value={!!row.is_active} />
                  </Box>

                  <Box className="col-span-3 text-[rgb(var(--subtle))] truncate">
                    {row.template_id ? row.template_id : "-"}
                  </Box>

                  <Box className="col-span-1 text-[rgb(var(--subtle))]">
                    {row.id}
                  </Box>

                  <Box className="col-span-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/workspace/manage/portfoliosView/${row.id}/edit`);
                    }}
                    sx={mergeSx(darkText, {
                        border: "1px solid rgba(148,163,184,.25)",
                        borderRadius: 1,
                    }) as any}
                    >
                    <EditIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => openDeleteConfirm([row.id])}
                      sx={mergeSx(darkText, { border: "1px solid rgba(148,163,184,.25)", borderRadius: 1, color: "#ef4444" }) as any}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* footer pagination */}
        <Box className="flex items-center justify-between p-3">
          <Typography variant="body2" className="text-[rgb(var(--subtle))]">
            {isFetching ? "Loading page..." : `${total} total`}
          </Typography>

          <Box className="flex items-center gap-2 ">
            <Button
              size="small"
              variant="outlined"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={mergeSx(darkText, { textTransform: "none" })}
            >
              Prev
            </Button>

            <Typography variant="body2" className="text-[rgb(var(--subtle))]">
              Page {page} of {totalPages}
            </Typography>

            <Button
              size="small"
              variant="outlined"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
              sx={mergeSx(darkText, { textTransform: "none" })}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete portfolio(s)"
        message={
          <>
            You are about to delete <b>{confirmIds.length}</b> portfolio(s).
            <br />
            This action cannot be undone.
          </>
        }
        confirmText="Delete"
        confirmColor="error"
        onClose={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        loading={confirmLoading}
      />
    </Box>
  );
}