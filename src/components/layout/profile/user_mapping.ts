import { type UserData } from "../../../auth/CurrentUser";

export function getRoleText(user?: Pick<UserData, "superuser" | "admin"> | null) {
  if (!user) return "—";
  if (user.superuser) return "Super Administrator";
  if (user.admin) return "Administrator";
  return "Normal";
}

export function getActiveText(user?: Pick<UserData, "active" | "locked"> | null) {
  if (!user) return "—";
  // precedence: locked overrides active
  if (user.locked) return "Locked";
  return user.active ? "Active" : "Inactive";
}

export function getApprovedText(user?: Pick<UserData, "approved"> | null) {
  if (!user) return "—";
  return user.approved ? "Approved" : "Not Approved";
}

export function parseInitialColors(csv?: string): [string, string] {
  const fallback = "#36aeb9";
  if (!csv) return [fallback, fallback];
  const parts = csv.split(",").map(s => s.trim()).filter(Boolean);
  return [parts[0] ?? fallback, parts[1] ?? fallback];
}

export function fullName(user?: Pick<UserData, "first_name"|"middle_name"|"last_name"> | null) {
  if (!user) return "—";
  const parts = [user.first_name, user.middle_name, user.last_name]
    .map(x => (x ?? "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
}