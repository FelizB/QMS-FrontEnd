// src/components/ThemeToggle.tsx
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function setThemeCookie(theme: Theme, days = 365) {
  const d = new Date();
  d.setTime(d.getTime() + days * 864e5);
  const expires = `expires=${d.toUTCString()}`;
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `theme=${theme}; ${expires}; path=/; samesite=Lax${secure}`;
}

function getThemeCookie(): Theme | null {
  const name = "theme=";
  const parts = decodeURIComponent(document.cookie || "")
    .split(";")
    .map((c) => c.trim());
  for (const p of parts) {
    if (p.startsWith(name)) {
      const v = p.substring(name.length);
      return v === "dark" || v === "light" ? v : null;
    }
  }
  return null;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "light" : getThemeCookie() ?? "light"
  );


useEffect(() => {
  const root = document.documentElement;
  const t = theme === "dark" ? "dark" : "light";
  root.classList.toggle("dark", t === "dark");
  root.style.colorScheme = t;

  // brute-force: remove any system listeners another code added
  const mm = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (mm?.removeEventListener) {
    try { mm.removeEventListener("change", () => {}); } catch {}
  }
  // Persist cookie last
  setThemeCookie(theme);
}, [theme]);


  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}