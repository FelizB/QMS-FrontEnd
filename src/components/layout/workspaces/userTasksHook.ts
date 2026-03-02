// ./userTasksHook.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  fetchTasks,
  fetchAssignees,
  createTask as createTaskApi,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
  deleteTasksBulk,
  type Task,
  type TaskFilters,
  type Assignee,
  type Paged,
} from '../../../api/tasks';

/** -------------------- Query Keys -------------------- **/
export const tasksKey = (projectId: number, filters: TaskFilters) =>
  ['tasks', projectId, filters] as const;

export const assigneesKey = (projectId: number) =>
  ['assignees', projectId] as const;

/** -------------------- Queries -------------------- **/
export function useTasks(
  projectId: number,
  filters: TaskFilters,
  opts?: { enabled?: boolean },
): UseQueryResult<Paged<Task>, Error> {
  return useQuery<Paged<Task>, Error>({
    queryKey: tasksKey(projectId, filters),
    queryFn: () => fetchTasks(projectId, filters),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    gcTime: 5 * 60_000,
    retry: 1,
    enabled: opts?.enabled ?? Boolean(projectId),
  });
}

export function useAssignees(
  projectId: number,
): UseQueryResult<Assignee[], Error> {
  return useQuery<Assignee[], Error>({
    queryKey: assigneesKey(projectId),
    queryFn: () => fetchAssignees(projectId),
    staleTime: 60_000,
    enabled: Boolean(projectId),
  });
}

/** -------------------- Mutations -------------------- **/

// Create task (expects API-ready payload)
export function useCreateTask(projectId: number, filters: TaskFilters) {
  const qc = useQueryClient();
  return useMutation({
    // payload type: Parameters<typeof createTaskApi>[1]
    mutationFn: (payload: Parameters<typeof createTaskApi>[1]) =>
      createTaskApi(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKey(projectId, filters) });
    },
  });
}

// Bulk delete
export function useDeleteTasks(projectId: number, filters: TaskFilters) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => deleteTasksBulk(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKey(projectId, filters) });
    },
  });
}

// Single delete
export function useDeleteTask(projectId: number, filters: TaskFilters) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => deleteTaskApi(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKey(projectId, filters) });
    },
  });
}

// Inline update with optimistic UI
export function useUpdateTask(projectId: number, filters: TaskFilters) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, patch }: { taskId: number; patch: Partial<Task> & { version?: number } }) =>
      updateTaskApi(taskId, {
        title: patch.title,
        description: patch.description ?? undefined,
        type: patch.type as any,
        priority: patch.priority as any,
        status: patch.status as any,
        // allow either assigneeId directly or patch.assignee.id
        assigneeId: (patch as any).assigneeId ?? (patch.assignee?.id ?? undefined),
        dueDate: patch.dueDate ?? undefined,
        version: patch.version,
      }),

    // Optimistic update of current page
    onMutate: async ({ taskId, patch }) => {
      await qc.cancelQueries({ queryKey: tasksKey(projectId, filters) });
      const key = tasksKey(projectId, filters);
      const previous = qc.getQueryData<Paged<Task>>(key);

      if (previous) {
        const next: Paged<Task> = {
          ...previous,
          items: previous.items.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  ...patch,
                  // If only assigneeId provided, leave existing assignee object until refetch
                  assignee:
                    (patch as any).assigneeId !== undefined
                      ? (patch as any).assigneeId === null
                        ? null
                        : t.assignee
                      : patch.assignee ?? t.assignee,
                  version: patch.version ?? t.version,
                }
              : t
          ),
        };
        qc.setQueryData(key, next);
      }
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(tasksKey(projectId, filters), ctx.previous);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: tasksKey(projectId, filters) });
    },
  });
}

/** -------------------- Prefetch (optional) -------------------- **/
export async function prefetchTasks(
  qc: ReturnType<typeof useQueryClient>,
  projectId: number,
  filters: TaskFilters,
) {
  await qc.prefetchQuery({
    queryKey: tasksKey(projectId, filters),
    queryFn: () => fetchTasks(projectId, filters),
  });
}