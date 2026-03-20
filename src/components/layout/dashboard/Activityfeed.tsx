import { Link } from "react-router-dom";
import {
  Bell,
  Clock,
  CreditCard,
  Settings,
  ShoppingBag,
  User,
  Briefcase,
  FolderKanban,
  FileText,
  ListChecks,
  Edit3,
  PlusCircle,
  Trash2,
  PlayCircle,
  Minus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQMSBackend } from "../../../generated/sdk/endpoints";

type EntityType = "user" | "portfolio" | "program" | "project" | "testcase" | "teststep";
type ActionType = "created" | "updated" | "deleted" | "executed";


function relativeTimeFromNow(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const sec = Math.round(diffMs / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);

    if (Math.abs(sec) < 60) return `${sec}s ago`;
    if (Math.abs(min) < 60) return `${min}m ago`;
    if (Math.abs(hr) < 24) return `${hr}h ago`;
    return `${day}d ago`;
  } catch {
    return iso;
  }
}

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function iconFor(entity: EntityType, action: ActionType) {
  // Base icon per entity
  let BaseIcon =
    entity === "user"
      ? User
      : entity === "portfolio"
      ? Briefcase
      : entity === "program"
      ? Briefcase
      : entity === "project"
      ? FolderKanban
      : entity === "testcase"
      ? FileText
      : entity === "teststep"
      ? ListChecks
      : Settings;

  // Color palette by action (you can tweak)
  if (action === "created")
    return { Icon: BaseIcon, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" };
  if (action === "updated")
    return { Icon: Edit3, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/20" };
  if (action === "deleted")
    return { Icon: Trash2, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/20" };
  if (action === "executed")
    return { Icon: PlayCircle, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/20" };

  return { Icon: Settings, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800/40" };
}

export default function ActivityFeed() {
  const api = getQMSBackend();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["recent-activity-feed", 10],
    queryFn: async () => {
      const res = await api.dashboardanalytics_v1_get_recentUnifiedActivityFeed({ limit: 8 });
      return res.data;
    },
  });
  

  const items = data?.items ?? [];

  return (
    <div className="bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Feed</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Recent user and project activities</p>
        </div>
        <Link to="/workspace/audit" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All
        </Link>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Failed to load recent feed"}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400">No recent activities found.</div>
        ) : (
          <div className="space-y-4">
            {items.map((it, idx) => {
              // it: { title, actor_first_name, performed_at, entity_type, action, entity_id }
              const entity = (it.entity_type ?? "project") as EntityType;
              const action = (it.action ?? "updated") as ActionType;
              const { Icon, color, bg } = iconFor(entity, action);
              const who = it.actor_first_name ?? "System";
              const when = relativeTimeFromNow(String(it.performed_at));

              return (
                <div
                  key={`${it.entity_type}-${it.entity_id}-${it.performed_at}-${idx}`}
                  className="flex items-start space-x-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${bg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
                      {it.title ?? `${titleCase(action)} ${entity}`}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {who} • {titleCase(action)} {entity}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">{when}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}