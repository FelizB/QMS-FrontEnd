import React from 'react';
import { Box, Button, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer, TextField } from '@mui/material';
import { useApprovals } from '../features/approvals/useApprovals';
import { darkText,darkInput } from '../components/common/T-colors';

export default function ApprovalDashboard() {
  const [status, setStatus] = React.useState<string>('pending');
  const [entity, setEntity] = React.useState<string>('');

  const { list, approve, reject } = useApprovals({
    status,
    entity_type: entity || undefined,
  });

  const items = (list.data as any)?.items ?? [];

  return (
    <div className="bg-white/80 shadow-xl dark:bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
    <Box className="text-slate-500 dark:text-slate-400" sx={{ p: 2 }}>
      <Stack direction="row" gap={2} alignItems="center" mb={2}>
        <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160, ...darkInput }}>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </Select>

        <Select size="small" value={entity} onChange={(e) => setEntity(e.target.value)} displayEmpty sx={{ minWidth: 180, ...darkInput }}>
          <MenuItem value="">All Entities</MenuItem>
          <MenuItem value="project">Project</MenuItem>
          <MenuItem value="program">Program</MenuItem>
          <MenuItem value="portfolio">Portfolio</MenuItem>
          <MenuItem value="user">User</MenuItem>
        </Select>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ ...darkText, bgcolor: 'transparent' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={darkText}>ID</TableCell>
              <TableCell sx={darkText}>Entity</TableCell>
              <TableCell sx={darkText}>Entity ID</TableCell>
              <TableCell sx={darkText}>Action</TableCell>
              <TableCell sx={darkText}>Maker</TableCell>
              <TableCell sx={darkText}>Created</TableCell>
              <TableCell sx={darkText}>Diff</TableCell>
              <TableCell sx={darkText}>Ops</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((r: any) => (
              <TableRow key={r.id} hover>
                <TableCell sx={darkText}>{r.id}</TableCell>
                <TableCell sx={darkText}>{r.entityType}</TableCell>
                <TableCell sx={darkText}>{r.entityId ?? '-'}</TableCell>
                <TableCell sx={darkText}>{r.action}</TableCell>
                <TableCell sx={darkText}>{r.makerId}</TableCell>
                <TableCell sx={darkText}>{new Date(r.createdAt).toLocaleString()}</TableCell>
                <TableCell sx={{ ...darkText, maxWidth: 320 }}>
                  <pre className="whitespace-pre-wrap text-xs">
                    {renderDiff(r.payloadBefore, r.payloadAfter)}
                  </pre>
                </TableCell>
                <TableCell>
                  {r.status === 'pending' ? (
                    <Stack direction="row" gap={1}>
                      <Button size="small" variant="contained" onClick={() => approve.mutate(r.id)}>Approve</Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          const reason = window.prompt('Reason?') || '';
                          reject.mutate({ id: r.id, reason });
                        }}
                      >
                        Reject
                      </Button>
                    </Stack>
                  ) : (
                    <span className="text-xs opacity-75">{r.status}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ ...darkText, textAlign: 'center', py: 4 }}>
                  No approvals.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    </div>
  );
}

function renderDiff(before?: any, after?: any): string {
  if (!before && after) return `+ ${JSON.stringify(after, null, 2)}`;
  if (before && !after) return `- ${JSON.stringify(before, null, 2)}`;
  if (!before && !after) return '';
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changes: string[] = [];
  for (const k of keys) {
    const a = before?.[k];
    const b = after?.[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push(`${k}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`);
    }
  }
  return changes.join('\n');
}