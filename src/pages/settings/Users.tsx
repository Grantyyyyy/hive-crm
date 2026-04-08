import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useUser } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCRMContext } from '@/lib/CRMContext';
import {
  fetchAppUsers,
  fetchRoles,
  updateUserRole,
  removeUser,
  addUser,
  inviteUser,
  upsertCurrentUser,
  type AppUser,
} from '@/lib/settingsService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  UserPlus,
  Shield,
  Trash2,
  Loader2,
  Mail,
  CheckCircle2,
  Search,
  MoreVertical,
  User as UserIcon,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ListSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/Pagination";
import { DeleteModal } from "@/components/ui/delete-modal";

// ── Actions dropdown ──────────────────────────────────────────────────────────

interface UserActionsMenuProps {
  u: AppUser;
  currentUserClerkId?: string;
  onChangeRole: () => void;
  onRemove: () => void;
  removePending: boolean;
}

function UserActionsMenu({ u, currentUserClerkId, onChangeRole, onRemove, removePending }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 6, left: rect.right - 208 });
    setOpen(v => !v);
  };

  const isSelf = u.authUserId === currentUserClerkId;

  if (isSelf) return null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
          className="w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60 py-2 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onChangeRole(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Shield className="w-4 h-4 shrink-0" />
            Change Role
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onRemove(); }}
            disabled={removePending}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            Remove User
          </button>
        </div>
      )}
    </>
  );
}

// ── Status/Role Badge ─────────────────────────────────────────────────────────

function UserRoleBadge({ roleName }: { roleName?: string }) {
  const getRoleStyle = (name?: string) => {
    switch (name?.toLowerCase()) {
      case 'admin':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      case 'manager':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'agent':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-transparent inline-flex items-center gap-1",
      getRoleStyle(roleName)
    )}>
      <Shield className="w-3 h-3" />
      {roleName || 'No Role'}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function Users() {
  const { user, isLoaded: userLoaded } = useUser();
  const { getClient, userId } = useCRMContext();
  const queryClient = useQueryClient();

  // Page State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog State
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [inviteMode, setInviteMode] = useState(true);
  const [editingRoleUser, setEditingRoleUser] = useState<AppUser | null>(null);
  const [newRoleId, setNewRoleId] = useState('');
  const [addForm, setAddForm] = useState({ name: '', email: '', roleId: '' });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  // Mutations
  const inviteUserMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; roleId?: string }) => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return inviteUser(client, data, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setAddForm({ name: '', email: '', roleId: '' });
      setShowAddDialog(false);
      toast.success('Invitation sent!', {
        description: 'The user will receive an email to set up their account.',
      });
    },
    onError: (error) => {
      toast.error('Failed to send invitation', {
        description: error.message,
      });
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; roleId?: string }) => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return addUser(client, data, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setAddForm({ name: '', email: '', roleId: '' });
      setShowAddDialog(false);
      toast.success('User added!', {
        description: 'User will appear once they sign in.',
      });
    },
    onError: (error) => {
      toast.error('Failed to add user', {
        description: error.message,
      });
    },
  });

  // Sync current Clerk user into app_users on load
  useEffect(() => {
    if (!user || !userId) return;
    (async () => {
      const client = await getClient();
      if (!client) return;
      try {
        await upsertCurrentUser(client, {
          id: user.id,
          email: user.email || '',
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          username: user.user_metadata?.user_name || undefined,
        }, userId);
      } catch (e) {
        console.error('Failed to sync current user:', e);
      }
    })();
  }, [user, userId, getClient]);

  // Data Fetching
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['app-users'],
    queryFn: async () => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return fetchAppUsers(client);
    },
    enabled: !!user && !!userId,
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return fetchRoles(client);
    },
    enabled: !!user,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ appUserId, roleId }: { appUserId: string; roleId: string }) => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return updateUserRole(client, appUserId, roleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingRoleUser(null);
      setNewRoleId('');
      setShowRoleDialog(false);
      toast.success('Role updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update role', { description: error.message });
    }
  });

  const removeUserMutation = useMutation({
    mutationFn: async (appUserId: string) => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return removeUser(client, appUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast.success('User removed from organization');
    },
    onError: (error) => {
      toast.error('Failed to remove user', { description: error.message });
    }
  });

  // Filter & Pagination Logic
  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    return usersData.filter(u => {
      const matchesSearch = !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role?.name?.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [usersData, search, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handlers
  const handleUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoleUser && newRoleId) {
      updateRoleMutation.mutate({ appUserId: editingRoleUser.id, roleId: newRoleId });
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (addForm.name && addForm.email) {
      if (inviteMode) {
        inviteUserMutation.mutate({
          name: addForm.name,
          email: addForm.email,
          roleId: addForm.roleId || undefined,
        });
      } else {
        addUserMutation.mutate({
          name: addForm.name,
          email: addForm.email,
          roleId: addForm.roleId || undefined,
        });
      }
    }
  };

  const handleRemoveUser = (u: AppUser) => {
    setUserToDelete(u);
    setShowDeleteModal(true);
  };

  const confirmRemoveUser = () => {
    if (userToDelete) {
      removeUserMutation.mutate(userToDelete.id, {
        onSuccess: () => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }
      });
    }
  };

  const openRoleDialog = (u: AppUser) => {
    setEditingRoleUser(u);
    setNewRoleId(u.roleId || '');
    setShowRoleDialog(true);
  };

  if (!userLoaded || usersLoading) {
    return <ListSkeleton />;
  }

  if (usersError) {
    return (
      <div className="p-6 md:p-8">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400 font-medium">Error loading users: {(usersError as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      <div className="mx-auto p-4 md:p-8 max-w-full animate-fade-in space-y-8">

        {/* Header Region */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">Organization Settings</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Users</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and track your organization members and their access levels.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={() => setShowAddDialog(true)}
              className="shadow-md shadow-indigo-100 dark:shadow-none"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit flex items-center">
            {['all', 'admin', 'manager', 'agent', 'no role'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                  roleFilter === role
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <Button variant="outlineNeutral" className="h-10 px-4">
            <Filter className="w-4 h-4 mr-2" /> More Filters
          </Button>
        </div>

        {/* Main Table Container */}
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Member</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Email Address</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500">Role</th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <UserIcon className="w-10 h-10 text-slate-300" />
                        <p className="text-slate-500 font-medium">No members found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold uppercase shadow-sm">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {u.name}
                              {u.authUserId === user?.id && (
                                <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter h-4 px-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800">You</Badge>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium md:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">{u.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <UserRoleBadge roleName={u.role?.name} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {u.authUserId !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRoleDialog(u)}
                              className="text-[11px] h-7 px-3 font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Shield className="w-3.5 h-3.5 mr-1" /> Role
                            </Button>
                          )}
                          <UserActionsMenu
                            u={u}
                            currentUserClerkId={user?.id}
                            onChangeRole={() => openRoleDialog(u)}
                            onRemove={() => handleRemoveUser(u)}
                            removePending={removeUserMutation.isPending}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
              itemLabel="users"
            />
          )}
        </div>
      </div>

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Change User Role</DialogTitle>
            <DialogDescription>
              Updating role for <span className="font-semibold text-slate-900 dark:text-white">{editingRoleUser?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRole}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newRole" className="text-xs font-bold uppercase tracking-wider text-slate-500">New Role</Label>
                <select
                  id="newRole"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                  required
                >
                  <option value="">Select a role</option>
                  {rolesData?.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outlineNeutral"
                onClick={() => setShowRoleDialog(false)}
                className="h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 dark:shadow-none"
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Role'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New User</DialogTitle>
            <DialogDescription>
              {inviteMode
                ? "Send an invitation email to create an account."
                : "Add a user manually (they'll sign in to claim their account)."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-4">
            <button
              onClick={() => setInviteMode(true)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                inviteMode ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500"
              )}
            >
              <Mail className="w-4 h-4" /> Send Invite
            </button>
            <button
              onClick={() => setInviteMode(false)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                !inviteMode ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-slate-500"
              )}
            >
              <UserPlus className="w-4 h-4" /> Manual Add
            </button>
          </div>

          <form onSubmit={handleAddUser}>
            <div className="space-y-4 py-2">
              {inviteMode && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-xs text-emerald-800 dark:text-emerald-400">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-bold mb-1">Invitation Link</p>
                      <p className="opacity-80">The user will receive an email to set their password and activate their account within your organization.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addUserRole" className="text-xs font-bold uppercase tracking-wider text-slate-500">Initial Role</Label>
                  <select
                    id="addUserRole"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    value={addForm.roleId}
                    onChange={(e) => setAddForm({ ...addForm, roleId: e.target.value })}
                  >
                    <option value="">Select a role (optional)</option>
                    {rolesData?.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outlineNeutral"
                onClick={() => setShowAddDialog(false)}
                className="h-11 rounded-xl"
                disabled={inviteUserMutation.isPending || addUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={cn(
                  "h-11 rounded-xl shadow-md",
                  inviteMode ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
                  "dark:shadow-none"
                )}
                disabled={inviteMode ? inviteUserMutation.isPending : addUserMutation.isPending}
              >
                {inviteMode
                  ? (inviteUserMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />)
                  : (addUserMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />)
                }
                {inviteMode
                  ? (inviteUserMutation.isPending ? 'Sending...' : 'Send Invitation')
                  : (addUserMutation.isPending ? 'Adding...' : 'Add User')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <DeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Remove User"
        description={
          <>
            Are you sure you want to remove <span className="font-semibold text-slate-900 dark:text-white">{userToDelete?.name}</span>?
            This action will revoke their access to the organization immediately.
          </>
        }
        onDelete={confirmRemoveUser}
        loading={removeUserMutation.isPending}
      />
    </div>
  );
}
