// src/common/refreshManager.ts
import { getQMSBackend } from "../../../generated/sdk/endpoints";
import { getAccessToken, getActiveAccessToken, getActiveRefreshToken, getRefreshToken, setTokensToActiveStore } from "./authStorage";
import { persistTokens } from "./authStorage";

let refreshing: Promise<string | null> | null = null;

type Tokens = {
  access_token: string;
  refresh_token?: string;
};

function extractTokens(res: any): Tokens | null {
  const data = res?.data ?? res;
  if (!data) return null;

  if (typeof data.access_token === "string") return data;
  if (data.token?.access_token) return data.token;

  return null;
}

/**
 * Refresh access token (mutex).
 * Reads refresh token directly from storage every time.
 * If no refresh token => returns null (caller should logout).
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    try {
      const access = getActiveAccessToken()
      const refresh = getActiveRefreshToken(); // direct storage read
      if (!access || !refresh) return null;

      const api = getQMSBackend();

     const res = await (api as any).auth_v1_post_refreshToken(
        { refresh_token: refresh },
        { headers: { Authorization: `Bearer ${access}` } }
        );


      const tokens = extractTokens(res);
      if (!tokens?.access_token) return null;

      // write tokens back to ACTIVE store
      setTokensToActiveStore(tokens);
      //persistTokens(tokens, { isRefresh: true });
      return tokens.access_token;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}