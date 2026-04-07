import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Button, Paper, Typography, Divider } from "@mui/material";
import { darkText, mergeSx } from "../../../common/T-colors";
import { pageBgSx, paperSurfaceSx } from "../../../common/T-colors";

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(to + "/");
}

export default function ManageLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tabs = [
    { label: "Portfolios", to: 'portfoliosView' },
    { label: "Programs", to: 'programsView' },
    { label: "Projects", to: 'projectsView' },
    { label: "Templates", to: 'templatesView' },
    
  ];

  return (
    <Box
      sx={pageBgSx}
      className="w-full min-h-screen"
    >
      {/* Header wireframe */}
      <Paper
        elevation={0}
        sx={[
          paperSurfaceSx,
          {
            p: 2,
            border: "1px solid rgba(var(--divider), 0.6)",
            borderRadius: 0,
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
          },
        ]}
        className="backdrop-blur-xl"
      >
        <Box className="flex items-start justify-between gap-3 flex-wrap">
          <Box>
            <Typography variant="h6" sx={{ color: "rgb(var(--text))", fontWeight: 700 }}>
              Manage
            </Typography>
            <Typography variant="body2" sx={{ color: "rgb(var(--text))", mt: 0.5 }}>
              View and manage Portfolios, Programs and Projects.
            </Typography>
          </Box>

          <Box className="flex items-center gap-2" />
        </Box>

        <Divider sx={{ my: 1, borderColor: "rgba(var(--divider), 0.6)" }} />

        {/* Button-like nav */}
        <Box className="flex items-center gap-2 flex-wrap">
          {tabs.map((t) => {
            const active = isActive(pathname, t.to);
            return (
              <Button
                key={t.to}
                onClick={() => navigate(t.to)}
                sx={mergeSx(
                  darkText,
                  {
                    textTransform: "none",
                    borderRadius: 1,
                    mt: 1,
                    px: 4,
                    py: 0.7,
                    border: active
                      ? "1px solid rgba(99,102,241,.55)"
                      : "1px solid rgba(148,163,184,.25)",
                    backgroundColor: active ? "rgba(99,102,241,.12)" : "transparent",
                    "&:hover": {
                      backgroundColor: active ? "rgba(99,102,241,.16)" : "rgba(148,163,184,.12)",
                    },
                  },
            )}
              >
                {t.label}
              </Button>
            );
          })}
        </Box>
      </Paper>

      {/* Outlet area */}
      <Box sx={{ mt: 2 }}>
        <Paper
          elevation={0}
          sx={[
            paperSurfaceSx,
            {
              p: 2,
              border: "1px solid rgba(var(--divider), 0.6)",
              borderRadius: 1,
              boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            },
          ]}
          className="backdrop-blur-xl"
        >
          <Outlet />
        </Paper>
      </Box>
    </Box>
  );
}