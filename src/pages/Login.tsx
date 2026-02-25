import { useState } from "react";
import {
  Box, Button, Container, TextField, Typography, Alert, CircularProgress, Paper, FormControlLabel, Checkbox
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { loginApi } from "../api/auth.api";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import type { LoginInput, TokenResponse } from "../api/auth.api";
import { usePostLoginPreload } from "../components/common/usePostLoginPreload";
import AuthCard from "../components/layout/AuthCard";


function withTimeout<T>(p: Promise<T>, ms = 10000): Promise<T> {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("Preload timed out")), ms);
    p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); });
  });
}


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
  const preload = usePostLoginPreload();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState<LoginInput>({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [preloading, setPreloading] = useState(false); // blocks redirect while we preload

  // Use mutateAsync so we can await the login before preloading + navigating
  const { mutateAsync, isPending } = useMutation<TokenResponse, any, LoginInput>({
    mutationFn: loginApi,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.username.trim() || !form.password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      // 1) Authenticate
      const data = await mutateAsync(form);

      // 2) Persist tokens (so preload has access)
      login(data.access_token, data.refresh_token, rememberMe);

      // 3) Preload all required data BEFORE navigation
      setPreloading(true);
      await withTimeout(preload()); // will call useAuthHydrate.refresh() and prefetch your app data

      // 4) Navigate once ready
      const next = (location.state as any)?.from ?? "/dashboard";
      navigate(next, { replace: true });
    } catch (e: any) {
      setError(extractErrorMessage(e));
    } finally {
      setPreloading(false);
    }
  };

  const blocking = isPending || preloading;

  return (

            <AuthCard>
                  <Typography variant="h5" component="h1" gutterBottom sx={{ textAlign: "center", color: "rgb(30 41 59)" }}>
                    Login
                  </Typography>

                  <Paper elevation={0} sx={{ p: 4, position: "relative", border: "none",boxShadow: "none",backgroundColor: "transparent"}}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={onSubmit} noValidate>
                      <TextField
                        margin="normal" fullWidth label="Username"
                        value={form.username}
                        onChange={(e) => setForm((s: any) => ({ ...s, username: e.target.value }))}
                        autoComplete="username" autoFocus
                      />
                      <TextField
                        margin="normal" fullWidth label="Password" type="password"
                        value={form.password}
                        onChange={(e) => setForm((s: any) => ({ ...s, password: e.target.value }))}
                        autoComplete="current-password"
                      />

                      <div className="mt-2 mb-2 flex w-full items-center justify-between">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              size="small"
                            />
                          }
                          label="Remember me"
                        />
                        <a href="#" className="text-indigo-500 hover:text-indigo-400">Forgot password?</a>
                      </div>

                      <Button type="submit" fullWidth variant="contained" disabled={blocking} sx={{ mt: 2 }}>
                        {blocking ? <CircularProgress size={22} color="inherit" /> : "Login"}
                      </Button>
                    </Box>

                    {blocking && (
                      <Box
                        sx={{
                          position: "fixed", inset: 0, display: "grid", placeItems: "center",
                          zIndex: 2000, backgroundColor: "rgba(2,6,23,0.5)", backdropFilter: "blur(1px)",
                        }}
                      >
                        <Paper sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
                          <CircularProgress size={22} />
                          <Typography variant="body2">Hold on while we prepare your workspace…</Typography>
                        </Paper>
                      </Box>
                    )}
                  </Paper>

                  {/* Optional socials row 
                  <div className="mt-6">
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">or login with social platforms</p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <SocialButton label="G" />
                      <SocialButton label="F" />
                      <SocialButton label="O" />
                      <SocialButton label="in" />
                    </div>
                  </div>
                 */}
                </AuthCard>

  );
}

{/*. 
function SocialButton({ label }: { label: string }) {
  return (
    <button
      className="h-9 w-9 rounded-md border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
      aria-label={label}
      type="button"
    >
      {label}
    </button>
 
  )}

  */}