import React, { useEffect, useRef } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { useUser } from "../../auth/useAuthHydrate";
import { LogoutButton } from "./LogoutButton";
import { useLocation, useNavigate } from "react-router-dom";

type ProfilePopoverProps = {
  open: boolean;
  onClose: () => void;
  anchorEl: React.RefObject<HTMLButtonElement | null>;
};

const menu =[
    { id: 'profile', icon:User ,label:"View Profile", path:'profile'},
    { id:"settings", icon: Settings, label:"Account Settings", path:'settings' }
]

const ProfilePopover: React.FC<ProfilePopoverProps> = ({ open, onClose, anchorEl }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useUser();
  const location = useLocation()
  const currentPath = location.pathname.replace(/^\//, '')
  const navigate = useNavigate()
  const handleNavigation = (path: string) => {
    navigate(`/${path}`)
  }

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
  const firstName = user?.first_name ?? "_";
  const lastName = user?.last_name ?? "_";
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
          alt="name"
          className="h-20 w-20 rounded-full ring-2 ring-blue-500 object-cover"
        />
        <div className="p-1">
          <p className="pt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
            {loading ? "Loading…" : firstName} {loading ? ".":lastName}
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
        {menu.map((item)=>{
         const isActive = currentPath === item.path;
         return(
          <div
            className={
              `flex w-full mb-2 rounded-xl transition-colors duration-200
              ${isActive
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-300'
              }`
            }
          >
            <button
              role="menuitem"
              className={`flex w-full items-center gap-4 p-3 text-left rounded-xl
                          ${!isActive ? 'hover:bg-slate-100 dark:hover:bg-slate-900/50' : 'hover:bg-blue-600'}`}
              onClick={() => { handleNavigation(item.path); onClose(); }}
            >
              <item.icon className={`h-4 w-4 ${isActive ? 'text-white/80' : 'text-slate-400'}`} />
              {item.label}
            </button>
          </div>
         )
         })}

        <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />

        {/* log out */}

        <LogoutButton/>

      </div>
    </div>
  );
};

export default ProfilePopover;