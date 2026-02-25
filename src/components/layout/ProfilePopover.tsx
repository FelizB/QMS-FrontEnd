import React, { useEffect, useRef } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { useUser } from "../../auth/useAuthHydrate";
import { LogoutButton } from "./LogoutButton";

type ProfilePopoverProps = {
  open: boolean;
  onClose: () => void;
  anchorEl: React.RefObject<HTMLButtonElement | null>;
};

const ProfilePopover: React.FC<ProfilePopoverProps> = ({ open, onClose, anchorEl }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useUser();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      // ignore clicks inside the panel
      if (panelRef.current && t && panelRef.current.contains(t)) return;
      // ignore clicks on the trigger button
      if (anchorEl.current && t && anchorEl.current.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, anchorEl]);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Focus first actionable element when open
  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>(
      "button, a, [tabindex]:not([tabindex='-1'])"
    );
    first?.focus();
  }, [open]);

  // It's safe to return null for not-open AFTER hooks are declared
  if (!open) return null;

  const displayName = user?.username ?? "—";
  const email = user?.email ?? "—";
  const roleText =
    user?.superuser ? "Super Administrator"
    : user?.admin     ? "Administrator"
    : user            ? "Normal"
    : "—";
  const avatar ="https://i.pravatar.cc/300";

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-labelledby="profile-menu-button"
      className="absolute right-0 top-full mt-5 z-[9999] w-72 origin-top-right rounded-xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-black/5 dark:border-slate-700/10 dark:bg-slate-800"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 p-4">
        <img
          src={avatar}
          alt={displayName}
          className="h-20 w-20 rounded-full ring-2 ring-blue-500 object-cover"
        />
        <div className="p-1">
          <p className="pt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
            {loading ? "Loading…" : displayName}
          </p>
          <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
            {loading ? "—" : email}
          </p>
          <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
            {loading ? "—" : roleText}
          </p>
        </div>
      </div>

      {/* Links */}
      <div className="mt-2 space-y-1">
        <button
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => {
            // navigate('/profile');
            onClose();
          }}
        >
          <User className="h-4 w-4 text-slate-400" />
          View Profile
        </button>

        <button
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => {
            // navigate('/settings');
            onClose();
          }}
        >
          <Settings className="h-4 w-4 text-slate-400" />
          Account Settings
        </button>

        <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />

        {/* log out */}

        <LogoutButton/>

      </div>
    </div>
  );
};

export default ProfilePopover;