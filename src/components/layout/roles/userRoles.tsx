import * as React from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';

import {
  useRoles,
  useActions,
  useGrants,
  useAddRole,
  useDeleteRole,
  useAddAction,
  useDeleteAction,
  useUpsertGrant,
  type RoleDto,
  type ActionDto,
} from './useRoleMatrix';

import { darkInput, darkText } from '../../common/T-colors';

export default function RoleMatrixPage() {
  // -------- UI state --------
  const [entity, setEntity] = React.useState<string>(''); // '' => global scope
  const [addRoleOpen, setAddRoleOpen] = React.useState(false);
  const [addActionOpen, setAddActionOpen] = React.useState(false);
  const [newRole, setNewRole] = React.useState('');
  const [newAction, setNewAction] = React.useState('');
  const [confirmRole, setConfirmRole] = React.useState<{ id: number; name: string } | null>(null);
  const [confirmAction, setConfirmAction] = React.useState<{ id: number; name: string } | null>(null);
  const [snack, setSnack] = React.useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  });
  const openSnack = (msg: string, sev: 'success' | 'error' = 'success') =>
    setSnack({ open: true, msg, sev });

  // -------- Queries / Mutations --------
  const rolesQ = useRoles();
  const actionsQ = useActions();
  const grantsQ = useGrants(entity || undefined);

  const addRoleM = useAddRole();
  const delRoleM = useDeleteRole();
  const addActionM = useAddAction();
  const delActionM = useDeleteAction();
  const upsertGrantM = useUpsertGrant();

  // Normalize Orval responses to arrays (handles either AxiosResponse or array)
  const asArray = (resp: unknown) => (Array.isArray(resp) ? resp : (resp as any)?.data ?? []);

  const roles: RoleDto[] = asArray(rolesQ.data);
  const actions: ActionDto[] = asArray(actionsQ.data);
  const grants: { role: string; action: string; entity_type?: string | null; allow: boolean }[] =
    asArray(grantsQ.data);

  // -------- Helpers --------
  const isAllowed = React.useCallback(
    (roleName: string, actionName: string) => {
      const g = grants.find(
        (x) =>
          x.role === roleName &&
          x.action === actionName &&
          ((entity || null) === (x.entity_type ?? null))
      );
      return g?.allow === true;
    },
    [grants, entity]
  );

  const toggleGrant = (roleName: string, actionName: string) => {
    const allow = !isAllowed(roleName, actionName);
    upsertGrantM.mutate(
      { role: roleName, action: actionName, entity_type: entity || undefined, allow },
      {
        onSuccess: () => openSnack('Saved', 'success'),
        onError: () => openSnack('Failed to save grant', 'error'),
      }
    );
  };

  const doAddRole = () => {
    const name = newRole.trim();
    if (!name) return;
    addRoleM.mutate(name, {
      onSuccess: () => {
        setNewRole('');
        setAddRoleOpen(false);
        openSnack('Role created', 'success');
      },
      onError: () => openSnack('Failed to create role', 'error'),
    });
  };

  const doAddAction = () => {
    const name = newAction.trim();
    if (!name) return;
    addActionM.mutate(name, {
      onSuccess: () => {
        setNewAction('');
        setAddActionOpen(false);
        openSnack('Action created', 'success');
      },
      onError: () => openSnack('Failed to create action', 'error'),
    });
  };

  const requestDeleteRole = (r: RoleDto) => {
    if (r.is_default) return;
    setConfirmRole({ id: r.id, name: r.name });
  };


  const requestDeleteAction = (a: ActionDto) => {
    if (a.is_default) return;
    setConfirmAction({ id: a.id, name: a.name });
  };

  const doDeleteRole = () => {
    if (!confirmRole) return;
    delRoleM.mutate(confirmRole.id, {
      onSuccess: () => openSnack('Role deleted', 'success'),
      onError: () => openSnack('Failed to delete role', 'error'),
      onSettled: () => setConfirmRole(null),
    });
  };

  const doDeleteAction = () => {
    if (!confirmAction) return;
    delActionM.mutate(confirmAction.id, {
      onSuccess: () => openSnack('Action deleted', 'success'),
      onError: () => openSnack('Failed to delete action', 'error'),
      onSettled: () => setConfirmAction(null),
    });
  };

  const isBusy =
    rolesQ.isLoading ||
    actionsQ.isLoading ||
    grantsQ.isLoading ||
    addRoleM.isPending ||
    addActionM.isPending ||
    delRoleM.isPending ||
    delActionM.isPending ||
    upsertGrantM.isPending;

  // -------- Render --------
  return (
     <div className="bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={darkText} gutterBottom>
        Role Matrix
      </Typography>

      {/* Top controls */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        {/* Add Role via modal */}
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => setAddRoleOpen(true)}>
            + Add Role
          </Button>
        </Stack>

        {/* Entity scope */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={darkText}>
            Scope:
          </Typography>
          <Select
            size="small"
            value={entity}
            onChange={(e) => setEntity(e.target.value as string)}
            displayEmpty
            sx={{ minWidth: 220, ...darkInput }}
          >
            <MenuItem value="">Global (all entities)</MenuItem>
            <MenuItem value="project">project</MenuItem>
            <MenuItem value="program">program</MenuItem>
            <MenuItem value="portfolio">portfolio</MenuItem>
            <MenuItem value="user">user</MenuItem>
          </Select>
        </Stack>

        {/* Add Action via modal */}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setAddActionOpen(true)}>
            + Add Action
          </Button>
        </Stack>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ ...darkText, bgcolor: 'transparent' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={darkText}>Action ↓ / Role →</TableCell>
              {roles.map((r: RoleDto) => (
                <TableCell key={r.id} align="center" sx={darkText}>
                  <Stack direction="row" gap={1} alignItems="center" justifyContent="center">
                    <span>{r.name}</span>
                    {r.is_default ? (
                      <Tooltip title="Default role (cannot delete)">
                        <LockIcon fontSize="small" />
                      </Tooltip>
                    ) : (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => requestDeleteRole(r)}
                        disabled={delRoleM.isPending}
                      >
                        {delRoleM.isPending && confirmRole?.id === r.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {actions.map((a: ActionDto) => (
              <TableRow key={a.id}>
                <TableCell sx={darkText}>
                  <Stack direction="row" gap={1} alignItems="center">
                    <span>{a.name}</span>
                    {a.is_default ? (
                      <Tooltip title="Default action (cannot delete)">
                        <LockIcon fontSize="small" />
                      </Tooltip>
                    ) : (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => requestDeleteAction(a)}
                        disabled={delActionM.isPending}
                      >
                        {delActionM.isPending && confirmAction?.id === a.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>

                {roles.map((r: RoleDto) => {
                  const allowed = isAllowed(r.name, a.name);
                  const busy = upsertGrantM.isPending;
                  return (
                    <TableCell key={`${a.id}-${r.id}`} align="center">
                      <Button
                        size="small"
                        variant={allowed ? 'contained' : 'outlined'}
                        color={allowed ? 'success' : 'inherit'}
                        onClick={() => toggleGrant(r.name, a.name)}
                        disabled={busy}
                      >
                        {busy ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : allowed ? (
                          'Allow'
                        ) : (
                          'Deny'
                        )}
                      </Button>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}

            {actions.length === 0 && (
              <TableRow>
                <TableCell colSpan={roles.length + 1} sx={{ ...darkText, textAlign: 'center', py: 4 }}>
                  No actions. Use “+ Add Action”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {isBusy && (
        <Typography variant="body2" sx={{ ...darkText, mt: 2 }}>
          Working…
        </Typography>
      )}
      {(rolesQ.error || actionsQ.error || grantsQ.error) && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          Failed to load RBAC data. Check console.
        </Typography>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2400}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.sev}
          variant="filled"
        >
          {snack.msg}
        </Alert>
      </Snackbar>

      {/* Confirm delete Role */}
      <Dialog open={!!confirmRole} onClose={() => setConfirmRole(null)}>
        <DialogTitle>Delete role</DialogTitle>
        <DialogContent>
          Delete role <b>{confirmRole?.name}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRole(null)}>Cancel</Button>
          <Button color="error" onClick={doDeleteRole} disabled={delRoleM.isPending}>
            {delRoleM.isPending ? <CircularProgress size={16} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete Action */}
      <Dialog open={!!confirmAction} onClose={() => setConfirmAction(null)}>
        <DialogTitle>Delete action</DialogTitle>
        <DialogContent>
          Delete action <b>{confirmAction?.name}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button color="error" onClick={doDeleteAction} disabled={delActionM.isPending}>
            {delActionM.isPending ? <CircularProgress size={16} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Role modal */}
      <Dialog open={addRoleOpen} onClose={() => setAddRoleOpen(false)}>
        <DialogTitle>New Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Role name"
            sx={{ mt: 1, ...darkInput }}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRoleOpen(false)}>Cancel</Button>
          <Button onClick={doAddRole} disabled={addRoleM.isPending || !newRole.trim()}>
            {addRoleM.isPending ? <CircularProgress size={16} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Action modal */}
      <Dialog open={addActionOpen} onClose={() => setAddActionOpen(false)}>
        <DialogTitle>New Action</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Action name"
            sx={{ mt: 1, ...darkInput }}
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddActionOpen(false)}>Cancel</Button>
          <Button onClick={doAddAction} disabled={addActionM.isPending || !newAction.trim()}>
            {addActionM.isPending ? <CircularProgress size={16} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </div>
  );
}
