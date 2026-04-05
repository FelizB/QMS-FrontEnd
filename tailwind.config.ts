import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
    content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        xl: "var(--radius)",
        "2xl": "calc(var(--radius) + 6px)",
      },
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",

        card: "rgb(var(--card) / <alpha-value>)",
        "card-fg": "rgb(var(--card-fg) / <alpha-value>)",

        popover: "rgb(var(--popover) / <alpha-value>)",
        "popover-fg": "rgb(var(--popover-fg) / <alpha-value>)",

        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-fg": "rgb(var(--muted-fg) / <alpha-value>)",

        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",

        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-fg": "rgb(var(--primary-fg) / <alpha-value>)",

        secondary: "rgb(var(--secondary) / <alpha-value>)",
        "secondary-fg": "rgb(var(--secondary-fg) / <alpha-value>)",

        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-fg": "rgb(var(--accent-fg) / <alpha-value>)",

        destructive: "rgb(var(--destructive) / <alpha-value>)",
        "destructive-fg": "rgb(var(--destructive-fg) / <alpha-value>)",

        success: "rgb(var(--success) / <alpha-value>)",
        "success-fg": "rgb(var(--success-fg) / <alpha-value>)",

        warning: "rgb(var(--warning) / <alpha-value>)",
        "warning-fg": "rgb(var(--warning-fg) / <alpha-value>)",

        info: "rgb(var(--info) / <alpha-value>)",
        "info-fg": "rgb(var(--info-fg) / <alpha-value>)",

        link: "rgb(var(--link) / <alpha-value>)",
        "link-hover": "rgb(var(--link-hover) / <alpha-value>)",

        title: "rgb(var(--title) / <alpha-value>)",
        body: "rgb(var(--body) / <alpha-value>)",
        subtle: "rgb(var(--subtle) / <alpha-value>)",

        table: {
          header: "rgb(var(--table-header) / <alpha-value>)",
          hover: "rgb(var(--table-row-hover) / <alpha-value>)",
          selected: "rgb(var(--table-row-selected) / <alpha-value>)",
        },
      },
      boxShadow: {
        soft: "0 8px 30px rgb(var(--shadow) / 0.10)",
      },
    },
  },
  plugins: [],
} satisfies Config;