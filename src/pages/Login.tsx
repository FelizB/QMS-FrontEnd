import { useState } from "react";
import {
  Box, Button, Container, TextField, Typography, Alert, CircularProgress, Paper, FormControlLabel, Checkbox
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { loginApi} from "../api/auth.api";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import type { LoginInput, TokenResponse } from "../api/auth.api";

function extractErrorMessage(err: any): string {

  if (err?.code === "ECONNABORTED" || (!err?.response && err?.request)) {
    return "Cannot reach the server. Please check your connection, ensure the API is running, and try again.";
  }

  const data = err?.response?.data;
  if (!data) return err?.message ?? "Request failed.";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    const msgs = data.detail.map((d: any) => d.msg).filter(Boolean);
    if (msgs.length) return msgs.join("; ");
  }
  return JSON.stringify(data);
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState<LoginInput>({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState<boolean>(true); // default ON (optional)
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation<TokenResponse, any, LoginInput>({
    mutationFn: loginApi,
    onSuccess: (data) => {
      login(data.access_token, data.refresh_token, rememberMe);
      const next = (location.state as any)?.from ?? "/dashboard";
      navigate(next, { replace: true });
    },
    onError: (e) => setError(extractErrorMessage(e)),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.username.trim() || !form.password.trim()) {
      setError("Username and password are required.");
      return;
    }
    mutate(form);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Sign in
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={onSubmit} noValidate>
          <TextField
            margin="normal"
            fullWidth
            label="Username"
            value={form.username}
            onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
            autoComplete="username"
            autoFocus
          />
          <TextField
            margin="normal"
            fullWidth
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            autoComplete="current-password"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            }
            label="Remember me"
          />

          <Button type="submit" fullWidth variant="contained" disabled={isPending} sx={{ mt: 2 }}>
            {isPending ? <CircularProgress size={22} color="inherit" /> : "Sign In"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}