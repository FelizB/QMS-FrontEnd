import React, { useEffect, useRef } from "react";
import { LogOut, Settings, User } from "lucide-react";

type ProfilePopoverProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
};

const ProfilePopover: React.FC<ProfilePopoverProps> = ({ open, onClose, anchorRef }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t as Node)) return;
      onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, anchorRef]);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Simple focus trap: move focus to panel on open
  useEffect(() => {
    if (open) {
      const first = panelRef.current?.querySelector<HTMLElement>("button,a,[tabindex]:not([tabindex='-1'])");
      first?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-labelledby="profile-menu-button"
      className="absolute mt-5.5 z-2147483646 right-0 top-full w-70 origin-top-right rounded-xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-black/5 dark:border-slate-700/10 dark:bg-slate-900/80"
    >
      {/* header */}
          <div className="p-4 flex items-center space-x-3">
            <img
              src="https://i.pravatar.cc/300"
              alt="User"
              className="w-20 h-20 rounded-full ring-2 ring-blue-500"
            />
            <div className="p-3">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-400">
                Feliz B
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                feliz@example.com
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Administrator
              </p>
            </div>
          </div>

      {/* links */}
      <div className="mt-2 space-y-1">
        <button
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => {
            // navigate('/profile'); // <-- wire to your router
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

        <button
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-950/30"
          onClick={() => {
            // await logout();
            onClose();
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default ProfilePopover;