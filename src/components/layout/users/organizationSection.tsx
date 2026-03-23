import React from 'react';
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { darkInput, darkText } from '../../common/T-colors';
import { COUNTRIES } from '../../constants/countries';

export type KVPair = { key: string; value: string };

export type WorksiteInfoUi = {
  code: string;
  name: string;
  address: string;
  city: string;
  country: string; // ISO code from COUNTRIES
  extras: KVPair[]; // UI layer for { [k: string]: any }
};

export type OrgErrors = Partial<Record<keyof WorksiteInfoUi, string>>;

type Props = {
  title: string;
  value: WorksiteInfoUi;
  onChange: (v: WorksiteInfoUi) => void;
  errors?: OrgErrors;
};

export const emptyWorksite = (): WorksiteInfoUi => ({
  code: '', name: '', address: '', city: '', country: '', extras: [],
});

// Convert UI → WorksiteInfo | undefined (never null)
export const toWorksiteOrUndef = (ui: WorksiteInfoUi) => {
  const extraObj: Record<string, unknown> = {};
  for (const { key, value } of ui.extras) if (key) extraObj[key] = value;
  const hasAny = ui.code || ui.name || ui.address || ui.city || ui.country || Object.keys(extraObj).length > 0;
  if (!hasAny) return undefined;
  return {
    code: ui.code || undefined,
    name: ui.name || undefined,
    address: ui.address || undefined,
    city: ui.city || undefined,
    country: ui.country || undefined,
    extra: Object.keys(extraObj).length ? extraObj : undefined,
  };
};

export const OrganizationSection: React.FC<Props> = ({ title, value, onChange, errors }) => {
  const handle = <K extends keyof WorksiteInfoUi>(key: K, v: WorksiteInfoUi[K]) =>
    onChange({ ...value, [key]: v });

  const addExtra = () =>
    onChange({ ...value, extras: [...value.extras, { key: '', value: '' }] });

  const removeExtra = (idx: number) =>
    onChange({ ...value, extras: value.extras.filter((_, i) => i !== idx) });

  const setExtra = (idx: number, patch: Partial<KVPair>) =>
    onChange({
      ...value,
      extras: value.extras.map((kv, i) => (i === idx ? { ...kv, ...patch } : kv)),
    });

  return (
    <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', pt: 2, mt: 1 }}>
      <Typography variant="subtitle1" sx={{ ...darkText, fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>

      {/* Two columns on md+, one on small */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField
          label="Code"
          size="small"
          value={value.code}
          onChange={(e) => handle('code', e.target.value)}
          error={!!errors?.code}
          helperText={errors?.code}
          fullWidth
          sx={darkInput}
        />
        <TextField
          label="Name"
          size="small"
          value={value.name}
          onChange={(e) => handle('name', e.target.value)}
          error={!!errors?.name}
          helperText={errors?.name}
          fullWidth
          sx={darkInput}
        />

        <TextField
          label="Address"
          size="small"
          value={value.address}
          onChange={(e) => handle('address', e.target.value)}
          fullWidth
          sx={darkInput}
        />
        <TextField
          label="City"
          size="small"
          value={value.city}
          onChange={(e) => handle('city', e.target.value)}
          fullWidth
          sx={darkInput}
        />

        <div>
          <Select
            size="small"
            fullWidth
            displayEmpty
            value={value.country ?? ''}
            onChange={(e) => handle('country', String(e.target.value))}
            sx={{ minWidth: 160, ...darkInput }}
            error={!!errors?.country}
          >
            <MenuItem value="">
              <em>-- Select Country --</em>
            </MenuItem>
            {COUNTRIES.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
          {errors?.country && (
            <Typography variant="caption" color="error">
              {errors.country}
            </Typography>
          )}
        </div>

        {/* Extras (full width) */}
        <div className="md:col-span-2">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
 <Typography variant="body2" sx={{ ...darkText, opacity: 0.9 }}>  Select,
              Extras (key/value)
            </Typography>
            <IconButton size="small" onClick={addExtra}>
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>

          <div className="grid grid-cols-12 gap-2">
            {value.extras.map((kv, idx) => (
              <React.Fragment key={idx}>
                <div className="col-span-5">
                  <TextField
                    size="small"
                    placeholder="key"
                    value={kv.key}
                    onChange={(e) => setExtra(idx, { key: e.target.value })}
                    fullWidth
                    sx={darkInput}
                  />
                </div>
                <div className="col-span-6">
                  <TextField
                    size="small"
                    placeholder="value"
                    value={kv.value}
                    onChange={(e) => setExtra(idx, { value: e.target.value })}
                    fullWidth
                    sx={darkInput}
                  />
                </div>
                <div className="col-span-1 flex items-center">
                  <IconButton size="small" onClick={() => removeExtra(idx)}>
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </Box>
  );
};
