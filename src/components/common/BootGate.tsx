import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usePostLoginPreload } from "./usePostLoginPreload";

/** Gate that ensures preload ran after a hard refresh. */
export default function BootGate({ children }: { children: React.ReactNode }) {
  const { isExpired } = useAuth();
  const preload = usePostLoginPreload();
  const [ready, setReady] = useState(!isExpired); // if not auth, nothing to preload

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isExpired) return;
      try {
        await preload();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [isExpired, preload]);

  if (!ready) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-slate-50 dark:bg-slate-950">
        <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }
  return <>{children}</>;
}