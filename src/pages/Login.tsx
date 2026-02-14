import { useState } from "react";
import {
  Box, Button, Container, TextField, Typography, Alert, CircularProgress, Paper
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import type { LoginInput } from "../api/auth.api";
import { loginApi } from "../api/auth.api";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";



function extractErrorMessage(err: any): string {
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
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      login(data.access_token);
      const next = (location.state as any)?.from ?? "/dashboard";
      navigate(next, { replace: true });
    },
    onError: (e: any) => {
      setError(extractErrorMessage(e));
      const msg =
        e?.response?.status === 401
          ? "Invalid username or password."
          : e?.response?.data?.detail ?? "Login failed. Please try again.";
      setError(msg);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // minimal validation
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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isPending}
            sx={{ mt: 2 }}
          >
            {isPending ? <CircularProgress size={22} color="inherit" /> : "Sign In"}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Forgot password? (Coming soon)
        </Typography>
      </Paper>
    </Container>
  );
}