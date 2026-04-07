import * as React from "react";
import { Box, Typography } from "@mui/material";

export default function ProgramsView() {
  return (
    <Box>
      <Typography variant="subtitle1" className="text-[rgb(var(--text))] font-semibold">
        Programs
      </Typography>
      <Typography variant="body2" className="text-[rgb(var(--muted))] mt-1">
        List and create programs (wireframe).
      </Typography>
    </Box>
  );
}