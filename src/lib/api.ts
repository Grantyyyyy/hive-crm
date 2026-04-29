import { supabase } from "./supabaseClient";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ── Audit Logging for API calls ────────────────────────────────────────────────

async function getAuditContext() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: { session } } = await supabase.auth.getSession();
    let organizationId = null;
    if (session?.access_token) {
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        organizationId = payload?.org_id ?? null;
      } catch {}
    }

    return { userId: user.id, organizationId };
  } catch {
    return null;
  }
}

function logAudit(entityType: string, entityId: string, action: string, diff: any) {
  getAuditContext().then(ctx => {
    if (!ctx) return;
    supabase.from('audit_log').insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      changed_by: ctx.userId,
      organization_id: ctx.organizationId,
      diff
    }).then(({ error }: any) => {
      if (error) console.error("[api.ts] Failed to emit audit log:", error);
    });
  });
}

interface ApiOptions {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  contactId?: string;
  dealId?: string;
  leadId?: string;
  entityType?: string;
  entityId?: string;
  priority?: string;
  type?: string;
  category?: string;
  stockLevel?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

let cachedToken: string | null = null;
let tokenResolveQueue: Array<() => void> = [];

type AuthListener = (data: { token: string | null }) => void;
let authListeners: AuthListener[] = [];

const notifyAuthListeners = () => {
  const data = { token: cachedToken };
  authListeners.forEach(listener => listener(data));
};

export const subscribeAuth = (listener: AuthListener) => {
  authListeners.push(listener);
  // Initial notification for the new subscriber
  listener({ token: cachedToken });
  return () => {
    authListeners = authListeners.filter(l => l !== listener);
  };
};

export { cachedToken };

export const setAuthToken = (token: string | null) => {
  if (cachedToken === token) return;
  cachedToken = token;
  if (token) {
    tokenResolveQueue.forEach(resolve => resolve());
    tokenResolveQueue = [];
  }
  notifyAuthListeners();
};

export const waitForToken = (): Promise<void> => {
  if (cachedToken) return Promise.resolve();
  return new Promise(resolve => {
    tokenResolveQueue.push(resolve);
    setTimeout(() => {
      tokenResolveQueue = tokenResolveQueue.filter(r => r !== resolve);
      resolve();
    }, 5000);
  });
};

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (cachedToken) {
    headers['Authorization'] = `Bearer ${cachedToken}`;
  }

  return headers;
}

interface AuditMeta {
  entityType: string;
  entityId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  diff: any;
}

async function request<T>(path: string, options: RequestInit = {}, params?: ApiOptions, auditMeta?: AuditMeta): Promise<T> {
  await waitForToken();
  const url = new URL(`${API_BASE}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const authHeaders = getAuthHeaders();

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    cachedToken = null;
    const currentPath = window.location.pathname;
    if (currentPath !== '/sign-in' && currentPath !== '/sign-up' && currentPath !== '/') {
      console.warn('Auth failed, clearing token. Will retry on next request.');
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const result = await response.json();

  // Emit audit log for mutations
  if (auditMeta) {
    logAudit(auditMeta.entityType, auditMeta.entityId, auditMeta.action, auditMeta.diff);
  }

  return result;
}

export const seedApi = {
  seed: () => request<SingleResponse<{ contacts: number; leads: number; deals: number; tasks: number; activities: number }>>('/api/seed', { method: 'POST' }),
};

export const contactsApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/contacts', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/contacts/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/contacts', { method: 'POST', body: JSON.stringify(data) }, undefined,
    { entityType: 'contacts', entityId: data.id || '', action: 'INSERT', diff: { new: data } }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, undefined,
    { entityType: 'contacts', entityId: id, action: 'UPDATE', diff: { updates: data } }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/contacts/${id}`, { method: 'DELETE' }, undefined,
    { entityType: 'contacts', entityId: id, action: 'DELETE', diff: { id } }),
};

export const dealsApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/deals', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/deals/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/deals', { method: 'POST', body: JSON.stringify(data) }, undefined,
    { entityType: 'deals', entityId: data.id || '', action: 'INSERT', diff: { new: data } }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/deals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, undefined,
    { entityType: 'deals', entityId: id, action: 'UPDATE', diff: { updates: data } }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/deals/${id}`, { method: 'DELETE' }, undefined,
    { entityType: 'deals', entityId: id, action: 'DELETE', diff: { id } }),
  stats: () => request<SingleResponse<any>>('/api/deals/stats'),
};

export const leadsApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/leads', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/leads/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/leads', { method: 'POST', body: JSON.stringify(data) }, undefined,
    { entityType: 'leads', entityId: data.id || '', action: 'INSERT', diff: { new: data } }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, undefined,
    { entityType: 'leads', entityId: id, action: 'UPDATE', diff: { updates: data } }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/leads/${id}`, { method: 'DELETE' }, undefined,
    { entityType: 'leads', entityId: id, action: 'DELETE', diff: { id } }),
  convert: (id: string, data: any) => request<SingleResponse<any>>(`/api/leads/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }, undefined,
    { entityType: 'leads', entityId: id, action: 'UPDATE', diff: { updates: { status: 'converted', ...data } } }),
  stats: () => request<SingleResponse<any>>('/api/leads/stats'),
};

export const tasksApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/tasks', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/tasks/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }, undefined,
    { entityType: 'tasks', entityId: data.id || '', action: 'INSERT', diff: { new: data } }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, undefined,
    { entityType: 'tasks', entityId: id, action: 'UPDATE', diff: { updates: data } }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/tasks/${id}`, { method: 'DELETE' }, undefined,
    { entityType: 'tasks', entityId: id, action: 'DELETE', diff: { id } }),
  upcoming: () => request<SingleResponse<any[]>>('/api/tasks/upcoming'),
  overdue: () => request<SingleResponse<any[]>>('/api/tasks/overdue'),
  stats: () => request<SingleResponse<any>>('/api/tasks/stats'),
};

export const activitiesApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/activities', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/activities/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/activities', { method: 'POST', body: JSON.stringify(data) }, undefined,
    { entityType: 'activities', entityId: data.id || '', action: 'INSERT', diff: { new: data } }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/activities/${id}`, { method: 'DELETE' }, undefined,
    { entityType: 'activities', entityId: id, action: 'DELETE', diff: { id } }),
  recent: (limit?: number) => request<SingleResponse<any[]>>('/api/activities/recent', {}, { limit }),
};

export const salesOrdersApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/sales-orders', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/sales-orders/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/sales-orders', { method: 'POST', body: JSON.stringify(data) }, undefined,
    { entityType: 'orders', entityId: data.id || '', action: 'INSERT', diff: { new: data } }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/sales-orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, undefined,
    { entityType: 'orders', entityId: id, action: 'UPDATE', diff: { updates: data } }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/sales-orders/${id}`, { method: 'DELETE' }, undefined,
    { entityType: 'orders', entityId: id, action: 'DELETE', diff: { id } }),
};

export const quotesApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/quotes', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/quotes/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/quotes', { method: 'POST', body: JSON.stringify(data) }, undefined,
    { entityType: 'quotes', entityId: data.id || '', action: 'INSERT', diff: { new: data } }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/quotes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, undefined,
    { entityType: 'quotes', entityId: id, action: 'UPDATE', diff: { updates: data } }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/quotes/${id}`, { method: 'DELETE' }, undefined,
    { entityType: 'quotes', entityId: id, action: 'DELETE', diff: { id } }),
};

export const inventoryApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/inventory', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/inventory/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/inventory', { method: 'POST', body: JSON.stringify(data) }, undefined,
    { entityType: 'inventory', entityId: data.id || '', action: 'INSERT', diff: { new: data } }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, undefined,
    { entityType: 'inventory', entityId: id, action: 'UPDATE', diff: { updates: data } }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/inventory/${id}`, { method: 'DELETE' }, undefined,
    { entityType: 'inventory', entityId: id, action: 'DELETE', diff: { id } }),
  categories: () => request<SingleResponse<string[]>>('/api/inventory/categories'),
};

export const purchaseOrdersApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/purchase-orders', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/purchase-orders/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/purchase-orders', { method: 'POST', body: JSON.stringify(data) }, undefined,
    { entityType: 'purchase_orders', entityId: data.id || '', action: 'INSERT', diff: { new: data } }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, undefined,
    { entityType: 'purchase_orders', entityId: id, action: 'UPDATE', diff: { updates: data } }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/purchase-orders/${id}`, { method: 'DELETE' }, undefined,
    { entityType: 'purchase_orders', entityId: id, action: 'DELETE', diff: { id } }),
};

export const purchaseRequestsApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/purchase-requests', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/purchase-requests/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/purchase-requests', { method: 'POST', body: JSON.stringify(data) }, undefined,
    { entityType: 'purchase_requests', entityId: data.id || '', action: 'INSERT', diff: { new: data } }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/purchase-requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, undefined,
    { entityType: 'purchase_requests', entityId: id, action: 'UPDATE', diff: { updates: data } }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/purchase-requests/${id}`, { method: 'DELETE' }, undefined,
    { entityType: 'purchase_requests', entityId: id, action: 'DELETE', diff: { id } }),
};

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  organizationId: string;
  roleId: string;
  role?: {
    id: string;
    name: string;
    color: string;
    isSystem: boolean;
    permissions?: Array<{
      id: string;
      module: string;
      action: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  color: string;
  isSystem: boolean;
  permissions?: Array<{
    id: string;
    module: string;
    action: string;
    description?: string;
  }>;
  _count?: {
    users: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
}

export const usersApi = {
  list: () => request<SingleResponse<User[]>>('/api/users'),
  getOne: (id: string) => request<SingleResponse<User>>(`/api/users/${id}`),
  updateRole: (userId: string, roleId: string) =>
    request<SingleResponse<User>>(`/api/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ roleId })
    }, undefined,
    { entityType: 'users', entityId: userId, action: 'UPDATE', diff: { updates: { roleId } } }),
  invite: (email: string, roleId: string) =>
    request<SingleResponse<{ invitationId: string; email: string; status: string }>>('/api/users/invite', {
      method: 'POST',
      body: JSON.stringify({ email, roleId })
    }, undefined,
    { entityType: 'users', entityId: '', action: 'INSERT', diff: { new: { email, roleId } } }),
  remove: (userId: string) =>
    request<SingleResponse<null>>(`/api/users/${userId}`, { method: 'DELETE' }, undefined,
    { entityType: 'users', entityId: userId, action: 'DELETE', diff: { id: userId } }),
  members: () => request<SingleResponse<any[]>>('/api/users/members'),
};

export const rolesApi = {
  list: () => request<SingleResponse<Role[]>>('/api/roles'),
  getOne: (id: string) => request<SingleResponse<Role>>(`/api/roles/${id}`),
  create: (data: { name: string; description?: string; color?: string; permissionIds?: string[] }) =>
    request<SingleResponse<Role>>('/api/roles', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id: string, data: { name?: string; description?: string; color?: string; permissionIds?: string[] }) =>
    request<SingleResponse<Role>>(`/api/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  delete: (id: string) =>
    request<SingleResponse<null>>(`/api/roles/${id}`, { method: 'DELETE' }),
  permissions: () => request<SingleResponse<Record<string, Permission[]>>>('/api/roles/permissions'),
  modules: () => request<SingleResponse<string[]>>('/api/roles/modules'),
};

export {
  request,
  type ApiOptions,
  type PaginatedResponse,
  type SingleResponse,
};
