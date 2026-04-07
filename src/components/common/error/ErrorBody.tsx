import * as React from "react";
import { Box, Typography } from "@mui/material";
import { getErrorData, getErrorMessage, type AnyError } from "./error";

export function ErrorBody({
  error,
  fallback,
  showRaw = false,
}: {
  error: AnyError;
  fallback?: string;
  showRaw?: boolean;
}) {
  const message = getErrorMessage(error, fallback);
  const raw = getErrorData(error);

  return (
    <Box>
      <Typography variant="body2" sx={{ color: "rgb(var(--subtle))" }}>
        {message}
      </Typography>

      {showRaw && raw ? (
        <Box
          component="pre"
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "rgba(148,163,184,.10)",
            border: "1px solid rgba(148,163,184,.25)",
            fontSize: 12,
            overflow: "auto",
            color: "rgb(var(--text))",
          }}
        >
          {JSON.stringify(raw, null, 2)}
        </Box>
      ) : null}
    </Box>
  );
}