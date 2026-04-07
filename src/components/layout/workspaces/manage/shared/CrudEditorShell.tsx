import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";

import { mergeSx } from "./sxMerge";
import { darkText } from "../../../../common/T-colors";
import { normalizeError } from "../../../../../lib/errors/normalize";
import { getErrorMessage } from "../../../../common/error/error";

type Props = {
  title: string;                 // e.g. "Add Portfolio" / "Update Portfolio"
  subtitle?: string;
  loading?: boolean;             // overall loading
  saving?: boolean;              // saving state
  error?: string | null;         // optional error banner

  canSave?: boolean;             // enable/disable Save
  onSave: () => void;            // called when Save clicked
  onCancel?: () => void;         // default: navigate(-1)

  // optional delete
  showDelete?: boolean;
  deleting?: boolean;
  onDelete?: () => void;

  children: React.ReactNode;      // the form UI
};

export default function CrudEditorShell({
  title,
  subtitle,
  loading,
  saving,
  error,
  canSave = true,
  onSave,
  onCancel,
  showDelete,
  deleting,
  onDelete,
  children,
}: Props) {
  const navigate = useNavigate();

  const handleCancel = () => {
    if (onCancel) return onCancel();
    navigate(-1);
  };

  return (
    <Box className="w-full min-h-screen text-[rgb(var(--subtle))] bg-[rgb(var(--bg))]">
      <Paper
        elevation={0}
        className="backdrop-blur-xl"
        sx={{
          p: 2,
          backgroundColor: "rgb(var(--bg))",
          border: "1px solid rgba(148,163,184,.25)",
          borderRadius: 1,
        }}
      >
        <Box className="flex items-start justify-between gap-3 flex-wrap">
          <Box>
            <Typography variant="h6" className="text-[rgb(var(--subtle))] font-semibold">
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" className="text-[rgb(var(--subtle))] mt-0.5">
                {subtitle}
              </Typography>
            ) : null}
          </Box>

          <Box className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon fontSize="small" />}
              onClick={handleCancel}
              disabled={!!saving || !!deleting}
              sx={mergeSx(darkText, { textTransform: "none" })}
            >
              Back
            </Button>

            {showDelete ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon fontSize="small" />}
                onClick={onDelete}
                disabled={!onDelete || !!saving || !!deleting}
                sx={mergeSx(darkText, { textTransform: "none" })}
              >
                {deleting ? <CircularProgress size={16} /> : "Delete"}
              </Button>
            ) : null}

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} sx={{ color: "white" }} /> : <SaveIcon fontSize="small" />}
              onClick={onSave}
              disabled={!canSave || !!saving || !!loading || !!deleting}
              sx={{
                textTransform: "none",
                borderRadius: 1,
              }}
            >
              Save
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2, borderColor: "rgba(148,163,184,.25)" }} />

        {error ? (
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              mb: 2,
              backgroundColor: "rgba(239,68,68,.08)",
              border: "1px solid rgba(239,68,68,.35)",
              borderRadius: 12,
              color: "rgb(var(--text))",
            }}
          >
            <Typography variant="body2" sx={{ color: "rgb(var(--subtle))" }}>
              {getErrorMessage(error)}
            </Typography>
          </Paper>
        ) : null}

        {loading ? (
          <Box className="flex items-center gap-2 p-3">
            <CircularProgress size={18} />
            <Typography className="text-[rgb(var(--muted))]">Loading...</Typography>
          </Box>
        ) : (
          children
        )}
      </Paper>
    </Box>
  );
}