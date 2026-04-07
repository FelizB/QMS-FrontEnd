import * as React from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { mergeSx } from "../shared/sxMerge";
import { darkInput } from "../../../../common/T-colors";

export type PortfolioFormMode = "create" | "update";

/**
 * Superset state that can produce both PortfolioCreate and PortfolioUpdate payloads.
 * - Keep booleans as true/false in UI (never null) and convert when building payload.
 * - Keep IDs as number|null (TextField provides strings, so we parse).
 * - custom_properties maintained as JSON string in UI and parsed to object/null for API.
 */
export type PortfolioFormState = {
  // required by create (min 2)
  name: string;

  // optionals (create/update)
  description: string;
  website: string;

  workspace_type_id: number | null;
  artifact_type_id: number | null;

  template_id: string;

  is_active: boolean;
  is_default: boolean;

  // custom JSON (object or null)
  custom_properties_text: string;

  // update-only required field
  concurrency_guid: string;
};

type Props = {
  mode: PortfolioFormMode;
  value: PortfolioFormState;
  onChange: (next: PortfolioFormState) => void;

  /** Optional: show validation summary on top */
  showValidationSummary?: boolean;
};

function parseNullableNumber(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function isValidJsonOrEmpty(text: string) {
  const t = text.trim();
  if (!t) return true; // allow empty = null
  try {
    const val = JSON.parse(t);
    return typeof val === "object" && val !== null; // should be object for your schema
  } catch {
    return false;
  }
}

function jsonError(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  try {
    const val = JSON.parse(t);
    if (typeof val !== "object" || val === null) {
      return "Custom properties must be a JSON object (e.g. {\"key\": \"value\"}).";
    }
    return null;
  } catch (e: any) {
    return "Invalid JSON. Please correct the format.";
  }
}

export default function PortfolioForm({
  mode,
  value,
  onChange,
  showValidationSummary = false,
}: Props) {
  const set = (patch: Partial<PortfolioFormState>) => onChange({ ...value, ...patch });

  const nameTrimmed = value.name.trim();
  const nameTooShort = nameTrimmed.length > 0 && nameTrimmed.length < 2;
  const nameTooLong = nameTrimmed.length > 200;

  const customJsonErr = jsonError(value.custom_properties_text);

  const hasErrors = nameTooShort || nameTooLong || !!customJsonErr;

  return (
    <Box className="space-y-3">
      <Typography variant="subtitle1" className="text-[rgb(var(--subtle))] font-semibold">
        Portfolio details
      </Typography>

      {showValidationSummary && hasErrors ? (
        <Alert severity="error">
          Please fix validation errors before saving.
        </Alert>
      ) : null}

      <Box className="grid grid-cols-12 gap-2">
        {/* Name */}
        <Box className="col-span-12 md:col-span-6">
          <TextField
            label="Name"
            size="small"
            fullWidth
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
            sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            error={nameTooShort || nameTooLong}
            helperText={
              nameTooShort
                ? "Name must be at least 2 characters."
                : nameTooLong
                  ? "Name must be at most 200 characters."
                  : " "
            }
          />
        </Box>

        {/* Website */}
        <Box className="col-span-12 md:col-span-6">
          <TextField
            label="Website"
            size="small"
            fullWidth
            value={value.website}
            onChange={(e) => set({ website: e.target.value })}
            sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            placeholder="https://example.com (optional)"
          />
        </Box>

        {/* Template ID */}
        <Box className="col-span-12 md:col-span-6">
          <TextField
            label="Template ID"
            size="small"
            fullWidth
            value={value.template_id}
            onChange={(e) => set({ template_id: e.target.value })}
            sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            placeholder="Optional"
          />
        </Box>

        {/* Workspace Type ID */}
        <Box className="col-span-12 md:col-span-3">
          <TextField
            label="Workspace Type ID"
            size="small"
            fullWidth
            value={value.workspace_type_id ?? ""}
            onChange={(e) => set({ workspace_type_id: parseNullableNumber(e.target.value) })}
            sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            placeholder="Optional"
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          />
        </Box>

        {/* Artifact Type ID */}
        <Box className="col-span-12 md:col-span-3">
          <TextField
            label="Artifact Type ID"
            size="small"
            fullWidth
            value={value.artifact_type_id ?? ""}
            onChange={(e) => set({ artifact_type_id: parseNullableNumber(e.target.value) })}
            sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            placeholder="Optional"
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          />
        </Box>

        {/* Description */}
        <Box className="col-span-12">
          <TextField
            label="Description"
            size="small"
            fullWidth
            value={value.description}
            onChange={(e) => set({ description: e.target.value })}
            multiline
            minRows={3}
            sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            placeholder="Optional"
          />
        </Box>

        {/* Active + Default */}
        <Box className="col-span-12 flex flex-wrap gap-3">
          <FormControlLabel
            control={
              <Checkbox
              sx={darkInput}
                checked={value.is_default}
                onChange={(e) => set({ is_default: e.target.checked })}
              />
            }
            label="Default"
          />

          <FormControlLabel
            control={
              <Checkbox
                sx={darkInput}
                checked={value.is_active}
                onChange={(e) => set({ is_active: e.target.checked })}
              />
            }
            label="Active"
          />
        </Box>

        {/* Custom properties JSON */}
        <Box className="col-span-12">
          <TextField
            label="Custom Properties (JSON object)"
            size="small"
            fullWidth
            disabled={mode === "update" || mode === "create"}
            value={value.custom_properties_text}
            onChange={(e) => set({ custom_properties_text: e.target.value })}
            multiline
            minRows={4}
            sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
            placeholder='Optional. Example: {"owner":"QA","tags":["finance","uat"]}'
            error={!!customJsonErr}
            helperText={customJsonErr ?? " "}
          />
        </Box>

        {/* Update-only: concurrency_guid */}
        {mode === "update" ? (
          <Box className="col-span-12 md:col-span-6">
            <TextField
              label="Concurrency GUID"
              size="small"
              fullWidth
              value={value.concurrency_guid}
              sx={mergeSx(darkInput, { backgroundColor: "rgb(var(--bg))" })}
              InputProps={{ readOnly: true }}
              helperText="Used for optimistic locking (required for update)."
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
