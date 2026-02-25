import { LogOut } from "lucide-react";
import { postLogout } from "../../api/axio";
import { useState } from "react";


export function LogoutButton({ className = "", confirm = false }: { className?: string; confirm?: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (confirm && !window.confirm("Are you sure you want to log out?")) return;
    setLoading(true);
    try {
      await postLogout(); // best-effort server logout (200/202/204/401)
    } finally {
      // Always clean up client state (centralized in the global handler)
      window.dispatchEvent(new Event("auth:logout"));
      setLoading(false);
    }
  };



    return(

        <button
          role="menuitem"
          onClick={handleClick}
          disabled={loading}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-950/30 
         ${className}`}>

          <LogOut className="h-4 w-4" />
          {loading ? "Signing out..." : "Sign out"}
        </button>
    )
}

