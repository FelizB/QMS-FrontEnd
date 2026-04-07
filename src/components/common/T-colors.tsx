// ../../common/T-colors.ts
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Typography color for headings/titles (NOT subtle).
 * Uses your token --fg (or --title if you have it).
 */
export const darkText: SxProps<Theme> = {
  color: 'rgb(var(--fg))',
};

/**
 * Global subtle style for inputs + labels + selects.
 * This is the "honors" bit: it styles the *actual MUI slots*:
 * - label: .MuiInputLabel-root
 * - textfield input: .MuiInputBase-input
 * - select display: .MuiSelect-select
 * - select icon: .MuiSvgIcon-root
 * - helper text: .MuiFormHelperText-root
 * - outline border: .MuiOutlinedInput-notchedOutline
 */
export const darkInput: Record<string, any> = {
  // Root color fallback (some slots inherit, many don't)
  color: 'rgb(var(--subtle))',
     
  // Label text
  '& .MuiInputLabel-root': {
    color: 'rgb(var(--subtle))',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'rgb(var(--subtle))',
  },
  '& .MuiInputLabel-root.Mui-error': {
    color: 'rgb(var(--destructive))',
  },

  // Helper text (caption under fields)
  '& .MuiFormHelperText-root': {
    color: 'rgb(var(--subtle))',
  },
  '& .MuiFormHelperText-root.Mui-error': {
    color: 'rgb(var(--destructive))',
  },

  // TextField input text
  '& .MuiInputBase-input': {
    color: 'rgb(var(--subtle))',
  },
  '& .MuiInputBase-input::placeholder': {
    color: 'rgb(var(--muted-fg, var(--subtle)))',
    opacity: 1,
  },

  // ✅ Select displayed value (this fixes your gender/country/department mismatch)
  '& .MuiSelect-select': {
    color: 'rgb(var(--subtle))',
    display: 'flex',
    alignItems: 'center',
  },

  // Placeholder when displayEmpty + <em> is used
  '& .MuiSelect-select em': {
    color: 'rgb(var(--muted-fg, var(--subtle)))',
    fontStyle: 'normal',
  },

  // Dropdown icon color
  '& .MuiSvgIcon-root': {
    color: 'rgb(var(--subtle))',
  },

  // Outlined borders (TextField + Select)
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgb(var(--border))',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgb(var(--border) / 0.85)',
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgb(var(--ring))',
    borderWidth: 2,
  },

  // Disabled (Chrome uses WebkitTextFillColor for inputs)
  '& .Mui-disabled': {
    opacity: 0.65,
  },
  '& .MuiInputBase-input.Mui-disabled': {
    WebkitTextFillColor: 'rgb(var(--subtle))',
  },
};

/**
 * Dropdown menu theming (Select options). Menus render in a Portal,
 * so container className doesn't apply — this ensures consistent colors.
 */
export const darkMenuProps = {
  PaperProps: {
    sx: {
      bgcolor: 'rgb(var(--popover))',
      color: 'rgb(var(--popover-fg))',
      border: '1px solid rgb(var(--border))',
      borderRadius: 2,
      boxShadow: '0 20px 60px rgb(0 0 0 / 0.25)',

      '& .MuiMenuItem-root': {
        color: 'rgb(var(--popover-fg))',
      },
      '& .MuiMenuItem-root:hover': {
        bgcolor: 'rgb(var(--ring) / 0.12)',
      },
      '& .MuiMenuItem-root.Mui-selected': {
        bgcolor: 'rgb(var(--ring) / 0.18)',
      },
      '& .MuiMenuItem-root.Mui-selected:hover': {
        bgcolor: 'rgb(var(--ring) / 0.25)',
      },
    },
  },
};

// common/T-colors.ts (or wherever you keep sx tokens)
export const tableSx = {
  // Container background
  backgroundColor: "rgb(var(--bg))",

  // The actual table element
  "& .MuiTable-root": {
    backgroundColor: "rgb(var(--bg))",
  },

  // Header row / header cells
  "& .MuiTableHead-root": {
    backgroundColor: "rgb(var(--bg))",
  },
  "& .MuiTableCell-head": {
    backgroundColor: "rgb(var(--bg))",
    color: "rgb(var(--muted))",
    fontWeight: 600,
    borderBottom: "1px solid rgba(var(--divider), 0.6)",
  },

  // Body cells
  "& .MuiTableCell-body": {
    backgroundColor: "rgb(var(--bg))",
    color: "rgb(var(--text))",
    borderBottom: "1px solid rgba(var(--divider), 0.35)",
  },

  // Rows (hover + optional zebra)
  "& .MuiTableRow-root:hover .MuiTableCell-body": {
    backgroundColor: "rgba(148,163,184,.10)",
  },

  // If you use stickyHeader, this ensures header stays themed
  "& .MuiTableCell-stickyHeader": {
    backgroundColor: "rgb(var(--bg))",
  },
} as const;

// common/T-colors.ts
export const paperSurfaceSx = {
  backgroundColor: "rgb(var(--bg))",
  color: "rgb(var(--text))",
  borderColor: "rgba(var(--divider), 0.6)",
} as const;

export const pageBgSx = {
  backgroundColor: "rgb(var(--bg))",
  color: "rgb(var(--subtle))",
} as const;


export const resolveSx = (sx: SxProps<Theme>, theme: Theme) =>
  (typeof sx === "function" ? (sx as any)(theme) : sx) as any;

export const mergeSx =
  (...parts: SxProps<Theme>[]) =>
  (theme: Theme) =>
    Object.assign({}, ...parts.map((p) => resolveSx(p, theme)));