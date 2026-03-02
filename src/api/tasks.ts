// src/api/tasks.ts
import type { AxiosResponse } from 'axios';
import { qmsApi } from './apiEndpoints';
// If Orval exported parameter/body types, import them here (adjust names to match your generation):
// import type { TasksV1GetListTasksParams, ProjectsV1CreateTaskBody, TasksV1UpdateTaskBody } from './apiEndpoints';

// --------------------- Types (unchanged) ---------------------
export type TaskType = 'TASK' | 'BUG' | 'FEATURE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export interface Assignee {
  id: number;
  name: string;
  avatarUrl?: string | null;
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee?: Assignee | null;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  description?: string | null;
}

export interface TaskFilters {
  search?: string;
  type?: TaskType | 'ALL';
  priority?: TaskPriority | 'ALL';
  status?: TaskStatus | 'ALL';
  assigneeId?: number | 'ALL';
  dueFrom?: string;
  dueTo?: string;
  page?: number;    // 1-based
  pageSize?: number;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --------------------- Helpers ---------------------
function toQuery(filters: TaskFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.type && filters.type !== 'ALL') params.set('type', filters.type);
  if (filters.priority && filters.priority !== 'ALL') params.set('priority', filters.priority);
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.assigneeId && filters.assigneeId !== 'ALL') params.set('assigneeId', String(filters.assigneeId));
  if (filters.dueFrom) params.set('dueFrom', filters.dueFrom);
  if (filters.dueTo) params.set('dueTo', filters.dueTo);
  params.set('page', String(filters.page ?? 1));
  params.set('pageSize', String(filters.pageSize ?? 10));
  return Object.fromEntries(params.entries());
}

function normalizeAssignee(u: any): Assignee | null {
  if (!u) return null;
  const name =
    (u.name as string) ||
    [u.first_name, u.last_name].filter(Boolean).join(' ').trim() ||
    (u.username as string) ||
    'User';
  return {
    id: Number(u.id),
    name,
    avatarUrl: u.avatarUrl ?? u.avatar_url ?? null,
  };
}

function normalizeTask(t: any): Task {
  return {
    id: Number(t.id),
    projectId: Number(t.project_id ?? t.projectId),
    title: t.title,
    description: t.description ?? null,
    type: t.type,
    priority: t.priority,
    status: t.status,
    assignee: normalizeAssignee(t.assignee),
    dueDate: t.due_date ?? t.dueDate ?? null,
    createdAt: t.created_at ?? t.createdAt,
    updatedAt: t.updated_at ?? t.updatedAt,
    version: t.version,
  };
}

function normalizePagedTasks(res: AxiosResponse<any> | any): Paged<Task> {
  // Accept both AxiosResponse and already-unwrapped data
  const data = (res && 'data' in res) ? (res as AxiosResponse<any>).data : res;

  const itemsRaw: any[] = data.items ?? data.results ?? [];
  const page = Number(data.page ?? data.page_no ?? 1);
  const pageSize = Number(data.pageSize ?? data.page_size ?? 10);
  const total = Number(data.total ?? data.count ?? itemsRaw.length);

  return {
    items: itemsRaw.map(normalizeTask),
    total,
    page,
    pageSize,
  };
}

export function friendlyAxiosError(err: unknown): string {
  const e = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
  if (e.response?.data?.detail) return e.response.data.detail;
  if (e.response?.status) return `HTTP ${e.response.status}: ${e.message}`;
  return e?.message ?? 'Unknown error';
}

// --------------------- API via qmsApi (Orval) ---------------------

/**
 * List tasks (paged)
 * GET /api/v1/projects/{projectId}/tasks
 */
export async function fetchTasks(projectId: number, filters: TaskFilters): Promise<Paged<Task>> {
  if (!projectId) throw new Error('projectId is required');
  const params = toQuery(filters);

  // 🔁 One of these signatures will compile in your project.
  // A) Positional args (common Orval style)
  // const res = await qmsApi.tasks_v1_get_listTasks(projectId, params);

  // B) Single "params object" arg (another Orval style)
  // const res = await qmsApi.tasks_v1_get_listTasks({ projectId, ...params });

  // 👉 Pick A or B above, then delete the other. For now, assume positional:
  const res = await (qmsApi as any).tasks_v1_get_listTasks(projectId, params);

  return normalizePagedTasks(res);
}

/**
 * Create task
 * POST /api/v1/projects/{projectId}/tasks
 */
export async function createTask(
  projectId: number,
  payload: {
    title: string;
    description?: string | null;
    type: TaskType;
    priority: TaskPriority;
    status: TaskStatus;
    assigneeId?: number | null;
    dueDate?: string | null;
  }
): Promise<Task> {
  if (!projectId) throw new Error('projectId is required');

  // Backend expects snake_case:
  const body = {
    title: payload.title,
    description: payload.description ?? null,
    type: payload.type,
    priority: payload.priority,
    status: payload.status,
    assignee_id: payload.assigneeId ?? null,
    due_date: payload.dueDate ?? null,
  };

  // A) Positional:
  // const res = await qmsApi.tasks_v1_post_createTask(projectId, body);

  // B) Params object:
  // const res = await qmsApi.tasks_v1_post_createTask({ projectId, data: body });

  const res = await (qmsApi as any).tasks_v1_post_createTask(projectId, body);
  const data = (res && 'data' in res) ? (res as AxiosResponse<any>).data : res;
  return normalizeTask(data);
}

/**
 * Update task (partial)
 * PATCH /api/v1/tasks/{taskId}
 */
export async function updateTask(
  taskId: number,
  patch: {
    title?: string;
    description?: string | null;
    type?: TaskType;
    priority?: TaskPriority;
    status?: TaskStatus;
    assigneeId?: number | null;
    dueDate?: string | null;
    version?: number;
  }
): Promise<Task> {
  if (!taskId) throw new Error('taskId is required');

  const body: Record<string, unknown> = {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.type !== undefined ? { type: patch.type } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.assigneeId !== undefined ? { assignee_id: patch.assigneeId } : {}),
    ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {}),
    ...(patch.version !== undefined ? { version: patch.version } : {}),
  };

  // A) Positional:
  // const res = await qmsApi.tasks_v1_patch_updateTask(taskId, body);

  // B) Params object:
  // const res = await qmsApi.tasks_v1_patch_updateTask({ taskId, data: body });

  const res = await (qmsApi as any).tasks_v1_patch_updateTask(taskId, body);
  const data = (res && 'data' in res) ? (res as AxiosResponse<any>).data : res;
  return normalizeTask(data);
}

/**
 * Delete task (soft-delete)
 * DELETE /api/v1/tasks/{taskId}
 */
export async function deleteTask(taskId: number): Promise<void> {
  if (!taskId) throw new Error('taskId is required');

  // A) Positional:
  // await qmsApi.tasks_v1_delete_task(taskId);

  // B) Params object:
  // await qmsApi.tasks_v1_delete_task({ taskId });

  await (qmsApi as any).tasks_v1_delete_deleteTask(taskId);
}

/**
 * Bulk delete tasks
 * POST /api/v1/tasks/bulk-delete
 */
export async function deleteTasksBulk(taskIds: number[]): Promise<void> {
  if (!taskIds?.length) return;

  const body = { ids: taskIds };

  // A) Positional:
  // await qmsApi.tasks_v1_post_bulkDeleteTasks(body);

  // B) Params object:
  // await qmsApi.tasks_v1_post_bulkDeleteTasks({ data: body });

  await (qmsApi as any).tasks_v1_post_bulkDeleteTasks(body);
}

/**
 * List assignees (for filter dropdown)
 * GET /api/v1/projects/{projectId}/assignees
 */
export async function fetchAssignees(projectId: number): Promise<Assignee[]> {
  if (!projectId) throw new Error('projectId is required');

  // A) Positional:
  // const res = await qmsApi.projects_v1_get_listAssignees(projectId);

  // B) Params object:
  // const res = await qmsApi.projects_v1_get_listAssignees({ projectId });

  const res = await (qmsApi as any).projects_v1_get_listAssignees(projectId);
  const data = (res && 'data' in res) ? (res as AxiosResponse<any>).data : res;
  return (data ?? []).map(normalizeAssignee).filter(Boolean) as Assignee[];
}