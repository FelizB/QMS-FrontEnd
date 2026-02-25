import { QueryClient } from "@tanstack/react-query";
import api from "../../api/axio";

/** Example API fetchers (adjust endpoints to your backend) */
async function fetchLookups() {
  const { data } = await api.get("/lookups");   // e.g., statuses, priorities, roles
  return data;
}
async function fetchSettings() {
  const { data } = await api.get("/settings/app");
  return data;
}
async function fetchNotifications() {
  const { data } = await api.get("/notifications/unread");
  return data;
}

/**
 * Preload all data needed for the first screen after login.
 * - Keep this FAST: only the data you need to render first view
 */
export async function preloadAppData(qc: QueryClient): Promise<void> {
  await Promise.allSettled([
    qc.prefetchQuery({ queryKey: ["lookups"], queryFn: fetchLookups, staleTime: 5 * 60_000 }),
    qc.prefetchQuery({ queryKey: ["settings"], queryFn: fetchSettings, staleTime: 5 * 60_000 }),
    qc.prefetchQuery({ queryKey: ["notifications", "unread"], queryFn: fetchNotifications, staleTime: 30_000 }),
  ]);
  // Use Promise.all if you want to fail the whole preload when one fails.
}