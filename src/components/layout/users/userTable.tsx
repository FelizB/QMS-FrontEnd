import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TableContainer,
  Paper,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export interface User {
  id: number;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  username: string;
  isAdmin: boolean;
  email: string;
  department?: string;
  unit?: string;            // using “unit” in your latest code
  userNumber: string;
  externalLogin: boolean;
  twoFactorEnabled: boolean;
  active: boolean;
}

export interface UserFilters {
  firstName?: string;
  lastName?: string;
  username?: string;
  admin?: 'yes' | 'no';
  email?: string;
  department?: string;
  organization?: string;
  userNumber?: string;
}

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  isLoading: boolean;
  error: any;
}

/** Shared dark-mode helpers */
const darkText = {
  color: (theme: any) =>
    theme.palette.mode === 'dark' ? theme.palette.common.white : 'inherit',
};

const darkInput = {
  '& .MuiInputBase-input': {
    color: (theme: any) =>
      theme.palette.mode === 'dark' ? theme.palette.common.white : 'inherit',
  },
  '& .MuiInputLabel-root': {
    color: (theme: any) =>
      theme.palette.mode === 'dark' ? theme.palette.grey[300] : 'inherit',
    '&.Mui-focused': {
      color: (theme: any) =>
        theme.palette.mode === 'dark' ? theme.palette.common.white : 'inherit',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: (theme: any) =>
      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.28)' : undefined,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: (theme: any) =>
      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.38)' : undefined,
  },
  '& .MuiSvgIcon-root': {
    color: (theme: any) =>
      theme.palette.mode === 'dark' ? theme.palette.common.white : 'inherit',
  },
  '& .MuiSelect-icon': {
    color: (theme: any) =>
      theme.palette.mode === 'dark' ? theme.palette.common.white : 'inherit',
  },
  '& .MuiMenu-paper': {
    bgcolor: (theme: any) =>
      theme.palette.mode === 'dark' ? '#0f172a' : undefined,
  },
};

export const UsersTable: React.FC<Props> = ({
  users,
  onEdit,
  isLoading,
  error,
}) => {
  const [filters, setFilters] = React.useState<UserFilters>({});
  const [selected, setSelected] = React.useState<number[]>([]);
  const [status, setStatus] = React.useState<'active' | 'all'>('active');

  const filteredUsers = users.filter((u) => {
    if (status === 'active' && !u.active) return false;
    if (filters.firstName && !u.firstName.toLowerCase().includes(filters.firstName.toLowerCase())) return false;
    if (filters.lastName && !u.lastName.toLowerCase().includes(filters.lastName.toLowerCase())) return false;
    if (filters.username && !u.username.toLowerCase().includes(filters.username.toLowerCase())) return false;
    if (filters.email && !u.email.toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.admin && (filters.admin === 'yes') !== u.isAdmin) return false;
    return true;
  });

  const toggleSelectAll = (checked: boolean) => {
    setSelected(checked ? filteredUsers.map((u) => u.id) : []);
  };

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div className="text-red-500">Failed to load users. Please refresh.</div>;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backdropFilter: 'blur(6px)',
        bgcolor: (t) =>
          t.palette.mode === 'dark' ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)',
        border: (t) =>
          `1px solid ${
            t.palette.mode === 'dark' ? 'rgba(148,163,184,0.35)' : 'rgba(226,232,240,0.5)'
          }`,
        ...darkText,
      }}
    >
      {/* Intro */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={darkText}>
          View / Edit Users
        </Typography>
        <Typography variant="body2" sx={{ ...darkText, opacity: 0.9, mt: 0.5 }}>
          The following approved users exist in the system. Use the controls to filter and edit users.
        </Typography>
      </Box>

      {/* Header controls */}
      <Stack direction="row" justifyContent="space-between" mb={2} alignItems="center">
        <Stack direction="row" spacing={1}>
          <Button variant="contained">+ Add</Button>
          <Button variant="outlined" sx={darkText}>Filter</Button>
          <Button variant="text" sx={darkText} onClick={() => setFilters({})}>
            Clear Filter
          </Button>
        </Stack>

        <Select
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          sx={{ minWidth: 160, ...darkInput }}
        >
          <MenuItem value="active">All Active</MenuItem>
          <MenuItem value="all">All Users</MenuItem>
        </Select>
      </Stack>

      {/* Table */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          bgcolor: 'transparent',
          borderColor: (t) =>
            t.palette.mode === 'dark' ? 'rgba(148,163,184,0.35)' : undefined,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={darkText} />
              <TableCell sx={darkText}>First Name</TableCell>
              <TableCell sx={darkText}>MI</TableCell>
              <TableCell sx={darkText}>Last Name</TableCell>
              <TableCell sx={darkText}>User Name</TableCell>
              <TableCell sx={darkText}>Admin</TableCell>
              <TableCell sx={darkText}>Email</TableCell>
              <TableCell sx={darkText}>Department</TableCell>
              <TableCell sx={darkText}>Organization</TableCell>
              <TableCell sx={darkText}>User #</TableCell>
              <TableCell sx={darkText}>Ext. Login</TableCell>
              <TableCell sx={darkText}>2FA</TableCell>
              <TableCell sx={darkText}>Active</TableCell>
              <TableCell sx={darkText}>Operations</TableCell>
            </TableRow>

            {/* Filters row */}
            <TableRow>
              <TableCell />
              <TableCell>
                <TextField
                  size="small"
                  value={filters.firstName || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, firstName: e.target.value }))}
                  sx={darkInput}
                />
              </TableCell>
              <TableCell />
              <TableCell>
                <TextField
                  size="small"
                  value={filters.lastName || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, lastName: e.target.value }))}
                  sx={darkInput}
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  value={filters.username || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, username: e.target.value }))}
                  sx={darkInput}
                />
              </TableCell>
              <TableCell>
                <Select
                  size="small"
                  value={filters.admin ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, admin: e.target.value as any }))}
                  displayEmpty
                  sx={{ minWidth: 140, ...darkInput }}
                >
                  <MenuItem value="">-- Any --</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  value={filters.email || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
                  sx={darkInput}
                />
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(user.id)}
                    onChange={() =>
                      setSelected((s) =>
                        s.includes(user.id) ? s.filter((id) => id !== user.id) : [...s, user.id]
                      )
                    }
                    sx={{
                      color: (t) => (t.palette.mode === 'dark' ? t.palette.common.white : undefined),
                      '&.Mui-checked': {
                        color: (t) =>
                          t.palette.mode === 'dark' ? t.palette.common.white : undefined,
                      },
                    }}
                  />
                </TableCell>

                <TableCell sx={darkText}>{user.firstName}</TableCell>
                <TableCell sx={darkText}>{user.middleInitial}</TableCell>
                <TableCell sx={darkText}>{user.lastName}</TableCell>
                <TableCell sx={darkText}>{user.username}</TableCell>
                <TableCell sx={darkText}>{user.isAdmin ? 'Yes' : 'No'}</TableCell>
                <TableCell sx={darkText}>{user.email}</TableCell>
                <TableCell sx={darkText}>{user.department}</TableCell>
                <TableCell sx={darkText}>{user.unit}</TableCell>
                <TableCell sx={darkText}>{user.userNumber}</TableCell>
                <TableCell sx={darkText}>{user.externalLogin ? 'Yes' : 'No'}</TableCell>
                <TableCell sx={darkText}>{user.twoFactorEnabled ? 'Yes' : 'No'}</TableCell>
                <TableCell sx={darkText}>{user.active ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => onEdit(user)}
                    sx={{ color: (t) => (t.palette.mode === 'dark' ? t.palette.common.white : 'inherit') }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} sx={{ ...darkText, opacity: 0.8, py: 4, textAlign: 'center' }}>
                  No users match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};