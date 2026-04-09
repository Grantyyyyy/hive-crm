import React, { useState, useMemo } from 'react';
import { useUser } from '@/lib/AuthContext';
import { usePermission } from '@/lib/usePermission';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCRMContext } from '@/lib/CRMContext';
import {
  fetchRoles,
  fetchPermissions,
  createRole,
  updateRole,
  deleteRole,
  type Role,
  type Permission,
} from '@/lib/settingsService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  Search,
  Lock,
  ChevronRight,
  Settings,
  Check,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListSkeleton } from "@/components/ui/skeletons";
import { toast } from 'sonner';
import { DeleteModal } from "@/components/ui/delete-modal";

// ── Main Page ─────────────────────────────────────────────────────────────────

export function Roles() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getClient, userId } = useCRMContext();
  const queryClient = useQueryClient();
  const { can, hasFullAccess, isLoaded: permLoaded } = usePermission();

  // Derived permission flags
  const canCreate = permLoaded && (hasFullAccess || can('roles', 'create'));
  const canUpdate = permLoaded && (hasFullAccess || can('roles', 'update'));
  const canDelete = permLoaded && (hasFullAccess || can('roles', 'delete'));

  // State
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    permissionIds: [] as string[],
    fullAccess: false,
  });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Queries
  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return fetchRoles(client);
    },
    enabled: !!user,
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return fetchPermissions(client);
    },
    enabled: !!user,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return createRole(client, data, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create role', { description: error.message });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return updateRole(client, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update role', { description: error.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return deleteRole(client, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete role', { description: error.message });
    }
  });

  const resetForm = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      color: '#6366f1',
      permissionIds: [],
      fullAccess: false,
    });
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    const allPermIds = permissionsData
      ? Object.values(permissionsData).flat().map(p => p.id)
      : [];
    const rolePermIds = role.permissions?.map(p => p.id) || [];
    const isFull = allPermIds.length > 0 && allPermIds.every(id => rolePermIds.includes(id));
    setFormData({
      name: role.name,
      description: role.description || '',
      color: role.color,
      permissionIds: rolePermIds,
      fullAccess: isFull,
    });
    setShowEditDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      fullAccess: false, // any individual toggle disables full access
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  /** Check if ALL permissions for a module are selected */
  const isModuleAllSelected = (modulePermissions: Permission[]): boolean => {
    if (modulePermissions.length === 0) return false;
    return modulePermissions.every(p => formData.permissionIds.includes(p.id));
  };

  /** Toggle all permissions for a specific module */
  const toggleModuleAll = (modulePermissions: Permission[]) => {
    setFormData(prev => {
      const allSelected = isModuleAllSelected(modulePermissions);
      const moduleIds = modulePermissions.map(p => p.id);
      if (allSelected) {
        // Deselect all for this module
        const newIds = prev.permissionIds.filter(id => !moduleIds.includes(id));
        return { ...prev, permissionIds: newIds, fullAccess: false };
      } else {
        // Add all for this module
        const newIds = [...new Set([...prev.permissionIds, ...moduleIds])];
        const allPermIds = permissionsData
          ? Object.values(permissionsData).flat().map(p => p.id)
          : [];
        const isFull = allPermIds.every(id => newIds.includes(id));
        return { ...prev, permissionIds: newIds, fullAccess: isFull };
      }
    });
  };

  /** Toggle full access — select ALL permissions across ALL modules */
  const toggleFullAccess = () => {
    setFormData(prev => {
      if (prev.fullAccess) {
        return { ...prev, fullAccess: false, permissionIds: [] };
      }
      const allPermIds = permissionsData
        ? Object.values(permissionsData).flat().map(p => p.id)
        : [];
      return { ...prev, fullAccess: true, permissionIds: allPermIds };
    });
  };

  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const confirmDeleteRole = () => {
    if (roleToDelete) {
      deleteMutation.mutate(roleToDelete.id, {
        onSuccess: () => {
          setShowDeleteModal(false);
          setRoleToDelete(null);
        }
      });
    }
  };

  // Filter Logic
  const filteredRoles = useMemo(() => {
    if (!rolesData) return [];
    return rolesData.filter(role =>
      role.name.toLowerCase().includes(search.toLowerCase()) ||
      role.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [rolesData, search]);

  if (!userLoaded || rolesLoading) {
    return <ListSkeleton />;
  }

  if (rolesError) {
    return (
      <div className="p-6 md:p-8">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400 font-medium">Error loading roles: {(rolesError as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">Access Control</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Roles & Permissions</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Define roles and granular permissions to control user access across modules.</p>
          </div>
          <div className="flex items-center gap-3">
            {canCreate && (
              <Button
                variant="default"
                onClick={() => setShowCreateDialog(true)}
                className="shadow-md shadow-indigo-100 dark:shadow-none"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Create Role
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            placeholder="Search by role name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="size-12 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: role.color, color: '#fff' }}
                  >
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                      {role.name}
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 text-slate-500 border-none">System</Badge>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{role._count?.users || 0} users assigned</p>
                  </div>
                </div>

                {!role.isSystem && (canUpdate || canDelete) && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canUpdate && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(role)}>
                        <Edit className="w-4 h-4 text-slate-400" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        onClick={() => handleDelete(role)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {role.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 min-h-[40px]">
                  {role.description}
                </p>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Permissions</span>
                  <span>{role.permissions?.length || 0} assigned</span>
                </div>

                {/* Full Access badge */}
                {(() => {
                  const allPermIds = permissionsData
                    ? Object.values(permissionsData).flat().map(p => p.id)
                    : [];
                  const rolePermIds = role.permissions?.map(p => p.id) || [];
                  const isFullAccess = allPermIds.length > 0 && allPermIds.every(id => rolePermIds.includes(id));
                  if (isFullAccess) {
                    return (
                      <Badge className="text-[10px] font-bold bg-gradient-to-r from-indigo-600 to-violet-600 border-none mb-2">
                        <Layers className="w-3 h-3 mr-1" /> FULL ACCESS
                      </Badge>
                    );
                  }
                  return null;
                })()}

                <div className="flex flex-wrap gap-1.5">
                  {role.permissions?.slice(0, 4).map((perm) => (
                    <Badge key={perm.id} variant="outline" className="text-[10px] py-0.5 px-2 font-bold bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800">
                      {perm.module}.{perm.action}
                    </Badge>
                  ))}
                  {(role.permissions?.length || 0) > 4 && (
                    <Badge variant="outline" className="text-[10px] py-0.5 px-2 font-bold">
                      +{(role.permissions?.length || 0) - 4} more
                    </Badge>
                  )}
                  {(!role.permissions || role.permissions.length === 0) && (
                    <span className="text-xs text-slate-400 italic">No permissions defined</span>
                  )}
                </div>
              </div>

              {canUpdate && (
                <div
                  className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer group/link hover:text-indigo-700"
                  onClick={() => handleEdit(role)}
                >
                  <span>{role.isSystem ? 'View Configuration' : 'Edit Capabilities'}</span>
                  <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredRoles.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-20 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <Lock className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold text-lg">No roles found</p>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your search or create a new custom role.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(true)}
                className="mt-4"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Create Your First Role
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || showEditDialog}
        onOpenChange={(v) => !v && resetForm()}
      >
        <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-bold">
              {editingRole ? 'Update Role' : 'Define New Role'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 pb-8">
            <div className="space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-black uppercase tracking-wider text-slate-500">Role Identity</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Senior Analyst"
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-xs font-black uppercase tracking-wider text-slate-500">Brand Color</Label>
                  <div className="flex gap-2">
                    <div
                      className="size-12 rounded-xl border-4 border-white dark:border-slate-800 shadow-sm overflow-hidden"
                      style={{ backgroundColor: formData.color }}
                    >
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </div>
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 h-12 rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-black uppercase tracking-wider text-slate-500">Functional Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Summarize the core responsibilities and access level for this role..."
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>

              {/* Permissions Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Granular Capabilities</Label>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                    {formData.permissionIds.length} SELECTED
                  </span>
                </div>

                {/* Full Access Toggle */}
                <div
                  onClick={toggleFullAccess}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200",
                    formData.fullAccess
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
                      : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center transition-all",
                      formData.fullAccess
                        ? "bg-white/20"
                        : "bg-slate-100 dark:bg-slate-800"
                    )}>
                      <Layers className={cn(
                        "w-5 h-5 transition-colors",
                        formData.fullAccess ? "text-white" : "text-slate-400"
                      )} />
                    </div>
                    <div>
                      <span className={cn(
                        "text-sm font-bold transition-colors",
                        formData.fullAccess ? "text-white" : "text-slate-700 dark:text-slate-300"
                      )}>
                        Full Access
                      </span>
                      <p className={cn(
                        "text-[10px] font-medium transition-colors",
                        formData.fullAccess ? "text-white/70" : "text-slate-400"
                      )}>
                        Grant all permissions across every module
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "size-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    formData.fullAccess
                      ? "bg-white border-white"
                      : "border-slate-300 dark:border-slate-600"
                  )}>
                    {formData.fullAccess && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                </div>

                <div className="space-y-6 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-900/30">
                  {Object.entries(permissionsData || {}).map(([module, permissions]) => {
                    const moduleAllSelected = isModuleAllSelected(permissions);
                    const moduleCount = permissions.filter(p => formData.permissionIds.includes(p.id)).length;
                    const isPartial = moduleCount > 0 && moduleCount < permissions.length;

                    return (
                      <div key={module} className="space-y-3">
                        {/* Module header with toggle-all */}
                        <div
                          onClick={() => toggleModuleAll(permissions)}
                          className="flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="w-3 h-3 text-slate-400" />
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                              {module}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-bold transition-colors",
                              moduleAllSelected
                                ? "text-indigo-600 dark:text-indigo-400"
                                : isPartial
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-400"
                            )}>
                              {moduleCount}/{permissions.length}
                            </span>
                            <div className={cn(
                              "size-5 rounded-md border-2 flex items-center justify-center transition-all",
                              moduleAllSelected
                                ? "bg-indigo-600 border-indigo-600"
                                : isPartial
                                  ? "bg-amber-500 border-amber-500"
                                  : "border-slate-300 dark:border-slate-600"
                            )}>
                              {moduleAllSelected && <Check className="w-3 h-3 text-white" />}
                              {isPartial && <div className="w-2 h-0.5 bg-white rounded-full" />}
                            </div>
                          </div>
                        </div>

                        {/* Individual action toggles */}
                        <div className="grid grid-cols-2 gap-2">
                          {permissions.map((permission) => (
                            <div
                              key={permission.id}
                              onClick={() => togglePermission(permission.id)}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-200",
                                formData.permissionIds.includes(permission.id)
                                  ? "bg-white dark:bg-indigo-900/20 border-indigo-600 shadow-sm"
                                  : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                              )}
                            >
                              <span className={cn(
                                "text-xs font-bold capitalize",
                                formData.permissionIds.includes(permission.id) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"
                              )}>
                                {permission.action}
                              </span>
                              <div className={cn(
                                "size-4 rounded-full border-2 transition-all flex items-center justify-center",
                                formData.permissionIds.includes(permission.id)
                                  ? "bg-indigo-600 border-indigo-600"
                                  : "border-slate-300 dark:border-slate-700"
                              )}>
                                {formData.permissionIds.includes(permission.id) && <div className="size-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </form>

          <DialogFooter className="p-8 pt-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 gap-3">
            <Button type="button" variant="outlineNeutral" onClick={resetForm} className="h-12 rounded-2xl px-8 font-bold">
              Dismiss
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="h-12 rounded-2xl px-10 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none font-bold"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                editingRole ? 'Save Changes' : 'Establish Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Modal */}
      <DeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Role"
        description={
          <>
            Are you sure you want to delete the role <span className="font-semibold text-slate-900 dark:text-white">"{roleToDelete?.name}"</span>?
            This action cannot be undone and may affect users assigned to this role.
          </>
        }
        onDelete={confirmDeleteRole}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
