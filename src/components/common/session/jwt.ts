// src/common/jwt.ts// src/common
export function getJwtExpSeconds(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );

    const obj = JSON.parse(json);
    return typeof obj.exp === "number" ? obj.exp : null;
  } catch {
    return null;
  }
}
