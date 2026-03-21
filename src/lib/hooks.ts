import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import * as api from './api'
import type { Contact } from './types'

type ResourceName = 'contacts' | 'deals' | 'leads' | 'tasks' | 'activities' | 'orders' | 'quotes' | 'inventory' | 'purchase_orders' | 'purchase_requests'

const apiMap: Record<ResourceName, any> = {
  contacts: api.contactsApi,
  deals: api.dealsApi,
  leads: api.leadsApi,
  tasks: api.tasksApi,
  activities: api.activitiesApi,
  orders: api.salesOrdersApi,
  quotes: api.quotesApi,
  inventory: api.inventoryApi,
  purchase_orders: api.purchaseOrdersApi,
  purchase_requests: api.purchaseRequestsApi,
}

const queryKeyMap: Record<ResourceName, string> = {
  contacts: 'contacts',
  deals: 'deals',
  leads: 'leads',
  tasks: 'tasks',
  activities: 'activities',
  orders: 'sales-orders',
  quotes: 'quotes',
  inventory: 'inventory',
  purchase_orders: 'purchase-orders',
  purchase_requests: 'purchase-requests',
}

function transformData(data: any, resourceName: ResourceName): any {
  switch (resourceName) {
    case 'contacts':
      return {
        ...data,
        source: (data.source || 'manual').toLowerCase(),
        status: data.status ? data.status.toLowerCase() : undefined,
      };
    case 'deals':
      return {
        ...data,
        stage: (data.stage || 'discovery').toLowerCase(),
      };
    case 'leads':
      return {
        ...data,
        source: (data.source || 'manual').toLowerCase(),
        status: (data.status || 'new').toLowerCase(),
      };
    case 'tasks':
      return {
        ...data,
        priority: (data.priority || 'medium').toLowerCase(),
        status: (data.status || 'open').toLowerCase().replace('_', '-'),
        entityType: data.entityType?.toLowerCase(),
      };
    case 'activities':
      return {
        ...data,
        type: (data.type || 'note').toLowerCase(),
      };
    default:
      return data;
  }
}

function transformCreate(data: any, resourceName: ResourceName): any {
  const d = { ...data };
  delete d.id;
  delete d.createdAt;
  delete d.updatedAt;
  delete d.ownerId;

  switch (resourceName) {
    case 'contacts':
      return { ...d, source: (d.source as string)?.toUpperCase() || 'MANUAL' };
    case 'deals':
      return { ...d, stage: (d.stage as string)?.toUpperCase() || 'DISCOVERY' };
    case 'leads':
      return { ...d, source: (d.source as string)?.toUpperCase() || 'MANUAL', status: (d.status as string)?.toUpperCase() || 'NEW' };
    case 'tasks':
      const taskPayload = { ...d };
      if (taskPayload.priority) taskPayload.priority = (taskPayload.priority as string).toUpperCase();
      if (taskPayload.status) taskPayload.status = (taskPayload.status as string).replace('-', '_').toUpperCase();
      if (taskPayload.entityType) taskPayload.entityType = (taskPayload.entityType as string).toUpperCase();
      return taskPayload;
    case 'activities':
      return { ...d, type: (d.type as string)?.toUpperCase() || 'NOTE' };
    default:
      return d;
  }
}

interface UseCRMResourceOptions {
  page?: number
  limit?: number
  search?: string
  status?: string
  entityType?: string
  entityId?: string
  contactId?: string
  dealId?: string
  leadId?: string
}

export function useCRMResource<T extends { id: string }>(
  resourceName: ResourceName,
  options?: UseCRMResourceOptions
) {
  const { user, isLoaded } = useUser()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState(options?.search || '')
  
  const queryKey = [queryKeyMap[resourceName], { ...options, search }]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiMap[resourceName].list({
        page: options?.page || 1,
        limit: options?.limit || 50,
        q: search || undefined,
        status: options?.status,
        entityType: options?.entityType,
        entityId: options?.entityId,
        contactId: options?.contactId,
        dealId: options?.dealId,
        leadId: options?.leadId,
      })
      return {
        data: (response.data || []).map((item: any) => transformData(item, resourceName)) as T[],
        pagination: response.pagination,
      }
    },
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiMap[resourceName].create(transformCreate(data, resourceName))
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeyMap[resourceName]] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiMap[resourceName].update(id, transformCreate(data, resourceName))
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeyMap[resourceName]] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiMap[resourceName].delete(id)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeyMap[resourceName]] })
    },
  })

  return {
    data: query.data?.data || [],
    pagination: query.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    search,
    setSearch,
    loading: query.isLoading,
    error: query.error?.message || null,
    isLoaded,
    userId: user?.id || '',
    addItems: async (items: Partial<T>[]) => {
      for (const item of items) {
        await createMutation.mutateAsync(item)
      }
    },
    updateItem: async (id: string, updates: Partial<T>) => {
      await updateMutation.mutateAsync({ id, data: updates })
    },
    deleteItem: async (id: string) => {
      await deleteMutation.mutateAsync(id)
    },
    refresh: () => query.refetch(),
    createLoading: createMutation.isPending,
    updateLoading: updateMutation.isPending,
    deleteLoading: deleteMutation.isPending,
  }
}

export function useSingleContact(id: string) {
  const query = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const response = await api.contactsApi.getOne(id)
      if (response.success && response.data) {
        return transformData(response.data, 'contacts') as Contact
      }
      return null
    },
    enabled: !!id,
  })

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error?.message || null,
  }
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.contactsApi.create(transformCreate(data, 'contacts'))
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.contactsApi.update(id, transformCreate(data, 'contacts'))
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.activitiesApi.create(transformCreate(data, 'activities'))
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.tasksApi.create(transformCreate(data, 'tasks'))
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.tasksApi.update(id, transformCreate(data, 'tasks'))
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.tasksApi.delete(id)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useConvertLead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.leadsApi.convert(id, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['deals'] })
    },
  })
}
