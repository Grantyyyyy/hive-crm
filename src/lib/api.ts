const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

async function request<T>(path: string, options: RequestInit = {}, params?: ApiOptions): Promise<T> {
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

  return response.json();
}

export const seedApi = {
  seed: () => request<SingleResponse<{ contacts: number; leads: number; deals: number; tasks: number; activities: number }>>('/api/seed', { method: 'POST' }),
};

export const contactsApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/contacts', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/contacts/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/contacts/${id}`, { method: 'DELETE' }),
};

export const dealsApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/deals', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/deals/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/deals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/deals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/deals/${id}`, { method: 'DELETE' }),
  stats: () => request<SingleResponse<any>>('/api/deals/stats'),
};

export const leadsApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/leads', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/leads/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/leads', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/leads/${id}`, { method: 'DELETE' }),
  convert: (id: string, data: any) => request<SingleResponse<any>>(`/api/leads/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }),
  stats: () => request<SingleResponse<any>>('/api/leads/stats'),
};

export const tasksApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/tasks', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/tasks/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/tasks/${id}`, { method: 'DELETE' }),
  upcoming: () => request<SingleResponse<any[]>>('/api/tasks/upcoming'),
  overdue: () => request<SingleResponse<any[]>>('/api/tasks/overdue'),
  stats: () => request<SingleResponse<any>>('/api/tasks/stats'),
};

export const activitiesApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/activities', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/activities/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/activities', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/activities/${id}`, { method: 'DELETE' }),
  recent: (limit?: number) => request<SingleResponse<any[]>>('/api/activities/recent', {}, { limit }),
};

export const salesOrdersApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/sales-orders', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/sales-orders/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/sales-orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/sales-orders/${id}`, { method: 'DELETE' }),
};

export const quotesApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/quotes', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/quotes/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/quotes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/quotes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/quotes/${id}`, { method: 'DELETE' }),
};

export const inventoryApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/inventory', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/inventory/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/inventory', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/inventory/${id}`, { method: 'DELETE' }),
  categories: () => request<SingleResponse<string[]>>('/api/inventory/categories'),
};

export const purchaseOrdersApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/purchase-orders', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/purchase-orders/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/purchase-orders/${id}`, { method: 'DELETE' }),
};

export const purchaseRequestsApi = {
  list: (params?: ApiOptions) => request<PaginatedResponse<any>>('/api/purchase-requests', {}, params),
  getOne: (id: string) => request<SingleResponse<any>>(`/api/purchase-requests/${id}`),
  create: (data: any) => request<SingleResponse<any>>('/api/purchase-requests', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<SingleResponse<any>>(`/api/purchase-requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<SingleResponse<any>>(`/api/purchase-requests/${id}`, { method: 'DELETE' }),
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
    }),
  invite: (email: string, roleId: string) =>
    request<SingleResponse<{ invitationId: string; email: string; status: string }>>('/api/users/invite', {
      method: 'POST',
      body: JSON.stringify({ email, roleId })
    }),
  remove: (userId: string) =>
    request<SingleResponse<null>>(`/api/users/${userId}`, { method: 'DELETE' }),
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
