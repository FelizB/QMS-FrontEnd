import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";

import type { ProgramOut } from "../../../../../generated/sdk/models";
import { useDeleteProgram, usePrograms } from "../hooks/usePrograms";
import { darkInput, darkText } from "../../../../common/T-colors";

function mergeSx(base: any, extra: any) {
  return (theme: any) => ({
    ...(typeof base === "function" ? base(theme) : base),
    ...(typeof extra === "function" ? extra(theme) : extra),
  });
}

function darkFieldSx(extra?: any) {
  return mergeSx(darkInput, {
    minWidth: 0,
    "& .MuiOutlinedInput-root": {
      backgroundColor: "rgba(15, 23, 42, 0.55)",
      color: "#e5e7eb",
      borderRadius: 2,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(148,163,184,.28)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(148,163,184,.45)",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(96,165,250,.7)",
    },
    "& .MuiInputLabel-root": {
      color: "#94a3b8",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#cbd5e1",
    },
    "& .MuiSelect-icon": {
      color: "#94a3b8",
    },
    "& .MuiInputBase-input::placeholder": {
      color: "#94a3b8",
      opacity: 1,
    },
    ...(typeof extra === "function" ? extra({}) : extra),
  });
}

function BoolChip({ value }: { value?: boolean | null }) {
  const v = !!value;
  return (
    <Chip
      size="small"
      label={v ? "Yes" : "No"}
      color={v ? "success" : "default"}
      variant={v ? "filled" : "outlined"}
    />
  );
}

function ConfirmDeleteDialog({
  open,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete Program</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Are you sure you want to delete this program? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ProgramsView() {
  const navigate = useNavigate();
  const isSmall = useMediaQuery("(max-width:900px)");

  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const [q, setQ] = React.useState("");
  const [defaultFilter, setDefaultFilter] = React.useState<"" | "true" | "false">("");
  const [activeFilter, setActiveFilter] = React.useState<"" | "true" | "false">("");
  const [templateFilter, setTemplateFilter] = React.useState<string>("");

  const { data, isLoading, isFetching, error, refetch } = usePrograms({
    page,
    page_size: pageSize,
    q,
    is_default: defaultFilter === "" ? undefined : defaultFilter === "true",
    is_active: activeFilter === "" ? undefined : activeFilter === "true",
    project_template_id: templateFilter === "" ? undefined : Number(templateFilter),
  });

  const deleteProgram = useDeleteProgram();

  const serverItems = data?.items ?? [];

  const filteredItems = React.useMemo(() => {
    return serverItems.filter((row: ProgramOut) => {
      const matchesQ =
        !q.trim() ||
        row.name?.toLowerCase().includes(q.trim().toLowerCase());

      const matchesDefault =
        defaultFilter === ""
          ? true
          : Boolean(row.is_default) === (defaultFilter === "true");

      const matchesActive =
        activeFilter === ""
          ? true
          : Boolean(row.is_active) === (activeFilter === "true");

      const matchesTemplate =
        templateFilter === ""
          ? true
          : String(row.project_template_id ?? "") === String(templateFilter);

      return matchesQ && matchesDefault && matchesActive && matchesTemplate;
    });
  }, [serverItems, q, defaultFilter, activeFilter, templateFilter]);

  const items = filteredItems;
  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const templateOptions = React.useMemo(() => {
    const values = Array.from(
      new Set(
        items
          .map((x: ProgramOut) => x.project_template_id)
          .filter((v): v is number => typeof v === "number")
      )
    ).sort((a, b) => a - b);

    return values;
  }, [items]);

  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const [toast, setToast] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSuccess = (message: string) =>
    setToast({ open: true, message, severity: "success" });

  const showError = (message: string) =>
    setToast({ open: true, message, severity: "error" });

  React.useEffect(() => {
    setSelectedIds([]);
  }, [page, q, defaultFilter, activeFilter, templateFilter]);

  React.useEffect(() => {
    if (error) {
      showError((error as any)?.message ?? "Failed to load programs.");
    }
  }, [error]);

  const selectedCount = selectedIds.length;
  const canUpdate = selectedCount === 1;
  const canDelete = selectedCount === 1;

  const selectedPrograms = items.filter((row: ProgramOut) => selectedIds.includes(row.id));
  const selectedProgram = selectedPrograms.length === 1 ? selectedPrograms[0] : null;

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(items.map((row: ProgramOut) => row.id));
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

  const onAdd = () => navigate("new");

  const onEdit = () => {
    if (selectedIds.length !== 1) return;
    navigate(`${selectedIds[0]}/edit`);
  };

  const onDelete = () => {
    if (selectedIds.length !== 1) return;
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!selectedProgram?.concurrency_guid) {
        throw new Error("Missing concurrency_guid for delete.");
      }

      await deleteProgram.mutateAsync({
        id: selectedProgram.id,
        concurrency_guid: selectedProgram.concurrency_guid,
      });

      setConfirmOpen(false);
      setSelectedIds([]);
      showSuccess("Program deleted successfully.");
    } catch (e: any) {
      showError(e?.message ?? "Failed to delete program.");
    }
  };

  return (
    <Box sx={{ p: isSmall ? 1 : 2, backgroundColor: "rgb(var(--bg))", minHeight: "100%" }}>
      <Paper elevation={0} sx={{ p: 0, borderRadius: 3, backgroundColor: "rgb(var(--bg))" }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
          mb={1}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Programs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={darkText}>
              Select one row to update or delete. Multiple selection disables both actions.
            </Typography>
          </Box>

          <Box display="flex" gap={3} flexWrap="wrap">
            <Button
            variant="outlined"
              startIcon={<AddIcon />}
              onClick={onAdd}
              sx={mergeSx(darkText, { textTransform: "none" })}
            >
              Add
            </Button>

            <Button
            variant="outlined"
              startIcon={<EditIcon />}
              disabled={!canUpdate}
              onClick={onEdit}
              sx={mergeSx(darkText, { textTransform: "none" })}
            >
              Update
            </Button>

            <Button
             variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              disabled={!canDelete}
              onClick={onDelete}
              sx={mergeSx(darkText, { textTransform: "none" })}
            >
              Delete
            </Button>

            <Button
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              disabled={isLoading}
              sx={mergeSx(darkText, {
                textTransform: "none",
                border: "1px solid rgba(148,163,184,.25)",
                borderRadius: 2,
              })}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2, borderColor: "rgba(148,163,184,.25)" }} />

        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "2fr 1fr 1fr 1fr" }}
          gap={1.5}
          mb={2}
        >
          <TextField
            placeholder="Search by name..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            fullWidth
            sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))",   "& .MuiOutlinedInput-root": {height: 44,}, "& .MuiInputBase-input": {padding: "10px 14px",}, })}
          />

          <FormControl fullWidth  sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))",   "& .MuiOutlinedInput-root": {height: 44,}, "& .MuiInputBase-input": {padding: "10px 14px",}, })}>
            <InputLabel id="program-default-filter-label" >Default (Any)</InputLabel>
            <Select
              labelId="program-default-filter-label"
              value={defaultFilter}
              onChange={(e) => {
                setDefaultFilter(e.target.value as "" | "true" | "false");
                setPage(1);
              }}
              
              input={<OutlinedInput label="Default (Any)" />}
            >
              <MenuItem value="">Default (Any)</MenuItem>
              <MenuItem value="true">Default: Yes</MenuItem>
              <MenuItem value="false">Default: No</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth  sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))",   "& .MuiOutlinedInput-root": {height: 44,}, "& .MuiInputBase-input": {padding: "10px 14px",}, })}>
            <InputLabel id="program-active-filter-label">Active (Any)</InputLabel>
            <Select
              labelId="program-active-filter-label"
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value as "" | "true" | "false");
                setPage(1);
              }}
              input={<OutlinedInput label="Active (Any)" />}
            >
              <MenuItem value="">Active (Any)</MenuItem>
              <MenuItem value="true">Active: Yes</MenuItem>
              <MenuItem value="false">Active: No</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth  sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))",   "& .MuiOutlinedInput-root": {height: 44,}, "& .MuiInputBase-input": {padding: "10px 14px",}, })}>
            <InputLabel id="program-template-filter-label">Template (Any)</InputLabel>
            <Select
              labelId="program-template-filter-label"
              value={templateFilter}
              onChange={(e) => {
                setTemplateFilter(String(e.target.value));
                setPage(1);
              }}
              input={<OutlinedInput label="Template (Any)" />}
            >
              <MenuItem value="">Template (Any)</MenuItem>
              {templateOptions.map((templateId) => (
                <MenuItem key={templateId} value={String(templateId)}>
                  Template {templateId}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Paper
          variant="outlined"
          sx={{
            overflow: "hidden",
            borderRadius: 2,
            backgroundColor: "rgb(var(--bg))",
          }}
        >
          <Box
            display="grid"
            gridTemplateColumns="56px 2fr 1fr 1fr 1fr 1fr 1fr"
            gap={1}
            px={2}
            py={1.5}

            sx={mergeSx(darkText, {              fontWeight: 700,
              borderBottom: "1px solid rgba(148,163,184,.2)",}) as any}
          >
            <Checkbox
              checked={allChecked}
              indeterminate={someChecked}
              onChange={(e) => toggleAll(e.target.checked)}
              sx={darkInput}
              
            />
            <Box>Name</Box>
            <Box>Portfolio ID</Box>
            <Box>Project Template</Box>
            <Box>Default</Box>
            <Box>Active</Box>
            <Box>Actions</Box>
          </Box>

          {error ? (
            <Box p={2}>
              Failed to load programs: {(error as any)?.message ?? "unknown error"}
            </Box>
          ) : isLoading ? (
            <Box p={2}>Loading...</Box>
          ) : items.length === 0 ? (
            <Box p={2}>No programs found.</Box>
          ) : (
            items.map((row: ProgramOut) => {
              const selected = isSelected(row.id);

              return (
                <Box
                  key={row.id}
                  display="grid"
                  gridTemplateColumns="56px 2fr 1fr 1fr 1fr 1fr 1fr"
                  gap={1}
                  px={2}
                  py={1.5}
                  onClick={() => toggleOne(row.id, !selected)}
                  sx={{
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(148,163,184,.12)",
                    backgroundColor: selected ? "rgba(59,130,246,.08)" : "transparent",
                    "&:hover": { backgroundColor: "rgba(148,163,184,.08)" },
                  }}
                >
                  <Checkbox
                    checked={selected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => toggleOne(row.id, e.target.checked)}
                    sx={mergeSx(darkText, {}) as any}
                  />

                  <Box sx={darkInput}>{row.name}</Box>
                  <Box sx={darkInput}>{row.portfolio_id ?? "-"}</Box>
                  <Box sx={darkInput}>{row.project_template_id ?? "-"}</Box>
                  <Box>
                    <BoolChip value={row.is_default} />
                  </Box>
                  <Box>
                    <BoolChip value={row.is_active} />
                  </Box>

                  <Box display="flex" gap={1}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${row.id}/edit`);
                        }}
                        sx={mergeSx(darkText, {
                                                border: "1px solid rgba(148,163,184,.25)",
                                                borderRadius: 1,
                                            }) as any}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIds([row.id]);
                          setConfirmOpen(true);
                        }}
                        sx={mergeSx(darkText, { border: "1px solid rgba(148,163,184,.25)", borderRadius: 1, color: "#ef4444" }) as any}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })
          )}
        </Paper>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="body2" className="text-[rgb(var(--subtle))]">
            {isFetching ? "Loading page..." : `${total} total`}
          </Typography>

          <Box display="flex" gap={1} alignItems="center">
            <Button
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
               sx={mergeSx(darkText, { textTransform: "none" })}
            >
              Prev
            </Button>
            <Typography variant="body2">
              Page {page} of {totalPages}
            </Typography>
            <Button
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
               sx={mergeSx(darkText, { textTransform: "none" })}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Paper>

      <ConfirmDeleteDialog
        open={confirmOpen}
        loading={deleteProgram.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}