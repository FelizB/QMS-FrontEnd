import api from "./axio";

export type LoginInput = { username: string; password: string };
export type TokenResponse = { access_token: string;refresh_token:string; token_type: "bearer" };

export async function loginApi(payload: LoginInput): Promise<TokenResponse> {
  const form = new URLSearchParams();
  form.set("grant_type", "password");   // optional with FastAPI; safe to include
  form.set("username", payload.username);
  form.set("password", payload.password);
  form.set("scope", "");                 // "" if you don't use scopes
  // form.set("client_id", "your-client-id");
  // form.set("client_secret", "your-client-secret");

  const res = await api.post<TokenResponse>("/auth/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
}