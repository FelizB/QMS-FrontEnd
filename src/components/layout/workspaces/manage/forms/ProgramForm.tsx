import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import type {
  ProgramCreate,
  ProgramUpdate,
} from "../../../../../generated/sdk/models";
import {
  useCreateProgram,
  useProgram,
  useUpdateProgram,
} from "../hooks/usePrograms";
import { darkInput, darkText } from "../../../../common/T-colors";

type Props = {
  mode: "create" | "edit";
};

function mergeSx(base: any, extra: any) {
  return (theme: any) => ({
    ...(typeof base === "function" ? base(theme) : base),
    ...(typeof extra === "function" ? extra(theme) : extra),
  });
}

type CustomPropertyRow = {
  key: string;
  value: string;
};

function objectToRows(obj?: Record<string, unknown> | null): CustomPropertyRow[] {
  if (!obj) return [];
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
}

function rowsToObject(rows: CustomPropertyRow[]) {
  const out: Record<string, unknown> = {};
  rows.forEach((row) => {
    const key = row.key.trim();
    if (!key) return;
    out[key] = row.value;
  });
  return out;
}

export default function ProgramForm({ mode }: Props) {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const isEdit = mode === "edit";

  const { data: program, isLoading } = useProgram(isEdit ? id : undefined);
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

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

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [portfolioId, setPortfolioId] = React.useState("");
  const [projectTemplateId, setProjectTemplateId] = React.useState("");
  const [workspaceTypeId, setWorkspaceTypeId] = React.useState("");
  const [artifactTypeId, setArtifactTypeId] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [isDefault, setIsDefault] = React.useState(false);
  const [customRows, setCustomRows] = React.useState<CustomPropertyRow[]>([]);

  React.useEffect(() => {
    if (!program) return;

    setName(program.name ?? "");
    setDescription(program.description ?? "");
    setWebsite(program.website ?? "");
    setPortfolioId(program.portfolio_id != null ? String(program.portfolio_id) : "");
    setProjectTemplateId(
      program.project_template_id != null ? String(program.project_template_id) : ""
    );
    setWorkspaceTypeId(
      program.workspace_type_id != null ? String(program.workspace_type_id) : ""
    );
    setArtifactTypeId(
      program.artifact_type_id != null ? String(program.artifact_type_id) : ""
    );
    setIsActive(!!program.is_active);
    setIsDefault(!!program.is_default);
    setCustomRows(objectToRows(program.custom_properties as Record<string, unknown> | null));
  }, [program]);

  const addCustomRow = () => {
    setCustomRows((prev) => [...prev, { key: "", value: "" }]);
  };

  const updateCustomRow = (index: number, patch: Partial<CustomPropertyRow>) => {
    setCustomRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const removeCustomRow = (index: number) => {
    setCustomRows((prev) => prev.filter((_, i) => i !== index));
  };

  const submitting = createProgram.isPending || updateProgram.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!name.trim()) {
        throw new Error("Name is required.");
      }

      if (!portfolioId.trim()) {
        throw new Error("Portfolio ID is required.");
      }

      if (isEdit) {
        if (!program?.concurrency_guid) {
          throw new Error("Missing concurrency_guid for update.");
        }

        const payload: ProgramUpdate = {
          name: name.trim(),
          description: description.trim() || null,
          website: website.trim() || null,
          portfolio_id: portfolioId ? Number(portfolioId) : null,
          project_template_id: projectTemplateId ? Number(projectTemplateId) : null,
          workspace_type_id: workspaceTypeId ? Number(workspaceTypeId) : null,
          artifact_type_id: artifactTypeId ? Number(artifactTypeId) : null,
          is_active: isActive,
          is_default: isDefault,
          custom_properties: rowsToObject(customRows),
          concurrency_guid: program.concurrency_guid,
        };

        await updateProgram.mutateAsync({ id: id as number, payload });
        showSuccess("Program updated successfully.");
      } else {
        const payload: ProgramCreate = {
          name: name.trim(),
          description: description.trim() || null,
          website: website.trim() || null,
          portfolio_id: Number(portfolioId),
          project_template_id: projectTemplateId ? Number(projectTemplateId) : null,
          workspace_type_id: workspaceTypeId ? Number(workspaceTypeId) : null,
          artifact_type_id: artifactTypeId ? Number(artifactTypeId) : null,
          is_active: isActive,
          is_default: isDefault,
          custom_properties: rowsToObject(customRows),
        };

        await createProgram.mutateAsync(payload);
        showSuccess("Program created successfully.");
      }

      setTimeout(() => {
        navigate("/workspace/manage/programsView");
      }, 500);
    } catch (e: any) {
      showError(e?.message ?? "Failed to save program.");
    }
  };

  if (isEdit && isLoading) {
    return <Box p={3}>Loading program...</Box>;
  }

  return (
    <Box sx={{ p: 3, backgroundColor: "rgb(var(--bg))", minHeight: "100%" }}>
      <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: "rgb(var(--bg))" }}>
        <Typography variant="h5" fontWeight={700} mb={1}>
          {isEdit ? "Update Program" : "Create Program"}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Fill in the program details below.
        </Typography>

        <Box component="form" onSubmit={onSubmit} display="grid" gap={2}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            inputProps={{ minLength: 2, maxLength: 200 }}
            sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
          />

          <TextField
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            fullWidth
            sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
          />

          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={2}>
            <TextField
              label="Portfolio ID"
              type="number"
              value={portfolioId}
              onChange={(e) => setPortfolioId(e.target.value)}
              required
              fullWidth
              sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            />

            <TextField
              label="Project Template ID"
              type="number"
              value={projectTemplateId}
              onChange={(e) => setProjectTemplateId(e.target.value)}
              fullWidth
              sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            />

            <TextField
              label="Workspace Type ID"
              type="number"
              value={workspaceTypeId}
              onChange={(e) => setWorkspaceTypeId(e.target.value)}
              fullWidth
              sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            />

            <TextField
              label="Artifact Type ID"
              type="number"
              value={artifactTypeId}
              onChange={(e) => setArtifactTypeId(e.target.value)}
              fullWidth
              sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            />
          </Box>

          <Box display="flex" gap={3} flexWrap="wrap">
            <FormControlLabel
              control={
                <Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              }
              label="Active"
            />
            <FormControlLabel
              control={
                <Checkbox checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
              }
              label="Default"
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>
              Custom Properties
            </Typography>

            <Box display="grid" gap={1}>
              {customRows.map((row, index) => (
                <Box
                  key={index}
                  display="grid"
                  gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr auto" }}
                  gap={1}
                >
                  <TextField
                    label="Key"
                    value={row.key}
                    onChange={(e) => updateCustomRow(index, { key: e.target.value })}
                    sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
                  />
                  <TextField
                    label="Value"
                    value={row.value}
                    onChange={(e) => updateCustomRow(index, { value: e.target.value })}
                    sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
                  />
                  <Button color="error" onClick={() => removeCustomRow(index)}>
                    Remove
                  </Button>
                </Box>
              ))}
            </Box>

            <Button
              onClick={addCustomRow}
              sx={mergeSx(darkText, { mt: 1, textTransform: "none" })}
            >
              Add Property
            </Button>
          </Box>

          <Box display="flex" gap={1} justifyContent="flex-end" mt={2}>
            <Button onClick={() => navigate("/workspace/manage/programsView")}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {isEdit ? "Update Program" : "Create Program"}
            </Button>
          </Box>
        </Box>
      </Paper>

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