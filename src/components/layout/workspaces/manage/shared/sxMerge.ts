import type { SxProps } from "@mui/system";
import type { Theme } from "@mui/material/styles";

export function mergeSx(...parts: SxProps<Theme>[]): SxProps<Theme> {
  return (theme: Theme) => {
    const resolved = parts.map((sx) =>
      typeof sx === "function" ? (sx as any)(theme) : sx
    );
    return Object.assign({}, ...resolved);
  };
}