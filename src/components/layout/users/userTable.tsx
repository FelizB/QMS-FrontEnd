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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { darkText, darkInput } from '../../common/T-colors';
import type { UserCreate, UserUpdate } from '../../../generated/sdk/models';
import { useNavigate } from 'react-router-dom';
import { useUserMutations } from './hooks/useMutations';


// ---------------- Your local table row type ----------------
export interface User {
  id: number;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  username: string;
  isAdmin: number;
  role_id: number;
  email: string;
  department?: string;
  unit?: string;            // “unit”
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
  onEdit: (user: User) => void; // kept for compatibility; still invoked
  isLoading: boolean;
  error: any;
}

// ---- Route helpers (adjust to your routing if different) ----
const ROUTE_CREATE_USER = '/users/register';
const routeEditUser = (id: number) => `/users/${id}/edit`;

export const UsersTable: React.FC<Props> = ({
  users,
  onEdit,
  isLoading,
  error,
}) => {
  const navigate = useNavigate();

  const [localUsers, setLocalUsers] = React.useState<User[]>(users);

  React.useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  const [filters, setFilters] = React.useState<UserFilters>({});
  const [selected, setSelected] = React.useState<number[]>([]);
  const [status, setStatus] = React.useState<'active' | 'all'>('active');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteTargetUsers, setDeleteTargetUsers] = React.useState<User[]>([]);

  const { deleteManyAsync } = useUserMutations();
  function confirmDelete(usersToDelete: User[]) {
  setDeleteTargetUsers(usersToDelete);
  setDeleteDialogOpen(true);
}

  const filteredUsers = localUsers.filter((u) => {
    if (status === 'active' && !u.active) return false;
    if (filters.firstName && !u.firstName.toLowerCase().includes(filters.firstName.toLowerCase())) return false;
    if (filters.lastName && !u.lastName.toLowerCase().includes(filters.lastName.toLowerCase())) return false;
    if (filters.username && !u.username.toLowerCase().includes(filters.username.toLowerCase())) return false;
    if (filters.email && !u.email.toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.admin && (filters.admin === 'yes') !== (u.role_id === 1 || u.role_id === 2)) return false;
    return true;
  });

  const toggleSelectAll = (checked: boolean) => {
    setSelected(checked ? filteredUsers.map((u) => u.id) : []);
  };

  // Map table row → baseline for edit prefill (snake_case aligned to UserUpdate)
  function tableUserToUpdateBaseline(u: User): UserUpdate {
    return {
      username: u.username,
      email: u.email,
      department: u.department ?? null,
      unit: u.unit ?? null,
      active: u.active,
      approved: null,
      locked: null,
      role_id:u.role_id ?? null,
      first_name: u.firstName,
      middle_name: u.middleInitial ?? null,
      last_name: u.lastName,
      phone: null,
      site: null,
      address: null,
      country: null,
      skills: null,
      primary_worksite_info: null,
      secondary_worksite_info: null,
    };
  }

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div className="text-red-500">Failed to load users. Please refresh.</div>;

  return (
    <>
    <Box
      className="text-slate-500 dark:text-slate-400 bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 relative"
      sx={{
        color: 'var(--app-text-color)',
        p: 2,
        borderRadius: 2,
        bgcolor: 'transparent',
        backdropFilter: 'blur(6px)',
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
      <Stack direction="row" justifyContent="space-between" mb={2} alignItems="center" gap={2}>
        <Stack direction="row" spacing={1}>
          {/* ADD → go to registration page */}
          <Button
            variant="contained"
            onClick={() => {
              navigate(ROUTE_CREATE_USER);
            }}
          >
            + Add
          </Button>
          <Button variant="outlined" sx={darkText}>Filter</Button>
          <Button variant="text" sx={darkText} onClick={() => setFilters({})}>
            Clear Filter
          </Button>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            variant="outlined"
            disabled={selected.length === 0}
            onClick={async () => {
              if (selected.length === 0) return;
                      const usersToDelete = users.filter(u => selected.includes(u.id));
                      confirmDelete(usersToDelete);
            }}
          >
            Delete selected ({selected.length})
          </Button>

          <Select
            size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            displayEmpty
            sx={{ minWidth: 160, ...darkInput }}
          >
            <MenuItem value="active">All Active</MenuItem>
            <MenuItem value="all">All Users</MenuItem>
          </Select>
        </Stack>
      </Stack>

      {/* Table */}
      <TableContainer
        className="text-slate-500 dark:text-slate-400"
        component={Paper}
        variant="outlined"
        sx={{
          ...darkText,
          bgcolor: 'transparent',
          borderColor: (t) => (t.palette.mode === 'dark' ? 'rgba(148,163,184,0.35)' : undefined),
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ fontWeight: 'bold' }}>
              <TableCell padding="checkbox" sx={darkText}>
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < filteredUsers.length}
                  checked={filteredUsers.length > 0 && selected.length === filteredUsers.length}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  sx={{
                    color: (t) => (t.palette.mode === 'dark' ? t.palette.common.white : 'grey'),
                    '&.Mui-checked': {
                      color: (t) => (t.palette.mode === 'dark' ? t.palette.common.white : undefined),
                    },
                  }}
                />
              </TableCell>
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
                  sx={{ color: 'GrayText', minWidth: 140, ...darkInput }}
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
                      color: (t) => (t.palette.mode === 'dark' ? t.palette.common.white : 'grey'),
                      '&.Mui-checked': {
                        color: (t) => (t.palette.mode === 'dark' ? t.palette.common.white : undefined),
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
                    onClick={() => {
                      onEdit?.(user); // keep parent callback
                      // ➜ EDIT → navigate to edit page with baseline for instant prefill
                      navigate(routeEditUser(user.id), {
                        state: {
                          initialUser: user,
                          initialUpdateBaseline: tableUserToUpdateBaseline(user),
                        },
                      });
                    }}
                    sx={{ color: (t) => (t.palette.mode === 'dark' ? t.palette.common.white : 'cyan') }}
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
            <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>

          <DialogContent>
            <Typography>
              Are you sure you want to delete the following user(s)?
            </Typography>

            <ul className="mt-3 ml-4 list-disc">
              {deleteTargetUsers.map((u) => (
                <li key={u.id}>
                  <strong>{u.firstName}</strong> ({u.username})
                </li>
              ))}
            </ul>

            <Typography className="mt-4 text-red-600">
              This action cannot be undone.
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={async () => {
                const ids = deleteTargetUsers.map(u => u.id);

                await deleteManyAsync(ids);

                // Remove locally so table updates instantly
                setLocalUsers(prev => prev.filter(u => !ids.includes(u.id)));
                setSelected([]);
                setDeleteDialogOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
</>
  );
};
