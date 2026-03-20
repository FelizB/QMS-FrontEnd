/** Shared dark-mode helpers */
export const darkText = {
  color: (theme: any) =>
    theme.palette.mode === 'dark' ? " color: 'var(--app-text-color)'" : 'inherit',
};
// Works for TextField / OutlinedInput without needing theme.palette.mode
export const darkInput = {
  '& .MuiInputBase-input': {
    color: 'var(--app-text-color)',
  },
  '& .MuiInputLabel-root': {
    color: 'var(--app-text-color)',
    '&.Mui-focused': {
      color: 'var(--app-text-color)',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    // subtle border in dark; override via CSS var if you prefer
    borderColor: 'rgba(255,255,255,0.28)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.38)',
  },
  '& .MuiSvgIcon-root': {
    color: 'var(--app-text-color)',
  },
  // For Select's dropdown menu, use MenuProps below (this selector won't hit it)
};
