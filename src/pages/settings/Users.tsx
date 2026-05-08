import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth, useUser } from '@/lib/AuthContext';
import { usePermission } from '@/lib/usePermission';
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
} from '@/lib/settingsService';
import type { AppUser } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Shield,
  Trash2,
  Loader2,
  Mail,
  CheckCircle2,
  Search,
  MoreVertical,
  User as UserIcon,
  Filter,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ListSkeleton } from "@/components/ui/skeletons";
import { Pagination } from "@/components/ui/Pagination";
import { DeleteModal } from "@/components/ui/delete-modal";
import { StatusTabs, type StatusTab } from '@/components/reusables/StatusTabs';
import { UserSheet } from '@/components/crmComponent/UserSheet';
import type { UserFormData } from '@/components/crmComponent/UserForm';
import { InitialsAvatar } from '@/components/reusables/InitialsAvatar';
import { logger } from '@/lib/logger';
import { checkSeatLimit } from '@/lib/helpers';

// ── Actions dropdown ──────────────────────────────────────────────────────────

interface UserActionsMenuProps {
  u: AppUser;
  currentUserId?: string;
  onChangeRole: () => void;
  onRemove: () => void;
  removePending: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

function UserActionsMenu({ u, currentUserId, onChangeRole, onRemove, removePending, canUpdate, canDelete }: UserActionsMenuProps) {
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

  const isSelf = u.authUserId === currentUserId;

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

      {open && (canUpdate || canDelete) && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
          className="w-52 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60 py-2 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {canUpdate && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onChangeRole(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-accent hover:bg-accent-dim transition-colors"
            >
              <Shield className="w-4 h-4 shrink-0" />
              Change Role
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onRemove(); }}
              disabled={removePending}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              Remove User
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ── Status/Role Badge ─────────────────────────────────────────────────────────

function UserRoleBadge({ roleName }: { roleName?: string }) {
  const getRoleStyle = (name?: string) => {
    switch (name?.toLowerCase()) {
      case 'super admin':
        return 'bg-accent-dim text-accent';
      case 'admin':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400';
      case 'manager':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit border border-transparent shadow-sm", getRoleStyle(roleName))}>
      {roleName || 'Custom Role'}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function Users() {
  const { isSignedIn, isLoaded: userLoaded, userId, organizationId } = useAuth();
  const { user } = useUser();
  const { getClient } = useCRMContext();
  const queryClient = useQueryClient();
  const { can, hasFullAccess, isLoaded: permLoaded, roleName, isSuperAdmin } = usePermission();

  const isAdmin = roleName === 'Admin';
  // Super Admins and Admins can invite users. Others cannot.
  const canCreate = permLoaded && (isSuperAdmin || isAdmin);
  const canUpdate = permLoaded && (hasFullAccess || can('users', 'update'));
  const canDelete = permLoaded && (hasFullAccess || can('users', 'delete'));

  // Page State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const roleTabs: StatusTab<string>[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'agent', label: 'Agent' },
    { value: 'custom role', label: 'Custom Role' },
  ];

  // Dialog State
  // Sheet State
  const [userSheetOpen, setUserSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  // Mutations
  const inviteUserMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; roleId?: string }) => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      if (!organizationId) throw new Error('Organization ID not available');
      return inviteUser(client, data, userId, organizationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setUserSheetOpen(false);
      setSelectedUser(null);
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
      if (!organizationId) throw new Error('Organization ID not available');
      return addUser(client, data, userId, organizationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setUserSheetOpen(false);
      setSelectedUser(null);
      toast.success('User created!', {
        description: 'The account is ready. They can sign in immediately with password: "password"',
      });
    },
    onError: (error) => {
      toast.error('Failed to add user', {
        description: error.message,
      });
    },
  });

  // Sync current user into app_users on load
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
        logger.error('Failed to sync current user:', e);
      }
    })();
  }, [user, userId, getClient]);

  // Data Fetching
  const { data: usersData, isLoading: usersLoading, error: usersError, isFetching } = useQuery({
    queryKey: ['app-users', organizationId],
    queryFn: async () => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      if (!organizationId) throw new Error('Organization ID not available');
      return fetchAppUsers(client, organizationId);
    },
    enabled: userLoaded && isSignedIn && !!userId && !!organizationId,
    staleTime: 0,
    retry: false,
  });

  const { data: rolesData, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return fetchRoles(client);
    },
    enabled: !!user,
  });

  // Fetch organization for seat limit display
  const { data: orgData } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      const client = await getClient();
      if (!client || !organizationId) throw new Error('Not authenticated');
      const { data, error } = await client
        .from('organizations')
        .select('plan, seats_limit, is_system')
        .eq('id', organizationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && !!user,
  });

  const availableRoles = useMemo(() => {
    if (!rolesData) return [];
    if (isSuperAdmin) return rolesData;
    if (isAdmin) return rolesData.filter(r => !['Super Admin', 'Admin'].includes(r.name));
    return [];
  }, [rolesData, isSuperAdmin, isAdmin]);

  const updateRoleMutation = useMutation({
    mutationFn: async ({ appUserId, roleId }: { appUserId: string; roleId: string }) => {
      const client = await getClient();
      if (!client) throw new Error('Not authenticated');
      return updateUserRole(client, appUserId, roleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedUser(null);
      setUserSheetOpen(false);
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
      const q = search.toLowerCase();
      const matchesSearch = !search ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' ||
        (roleFilter === 'custom role' ? !u.role : u.role?.name?.toLowerCase() === roleFilter.toLowerCase());
      return matchesSearch && matchesRole;
    });
  }, [usersData, search, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handlers
  const handleSaveUser = async (data: UserFormData) => {
    if (selectedUser) {
      // Updating existing user's role - no seat limit check needed
      if (data.roleId) {
        updateRoleMutation.mutate({ appUserId: selectedUser.id, roleId: data.roleId });
      } else {
        toast.error("Please select a role");
      }
    } else {
      // Creating new user - check seat limit
      if (!organizationId) {
        toast.error("Organization ID not available");
        return;
      }

      try {
        const client = await getClient();
        if (!client) {
          toast.error("Not authenticated");
          return;
        }

        // Check seat limit
        const seatCheck = await checkSeatLimit(client, organizationId);

        if (!seatCheck.allowed) {
          // Show plan-specific upgrade message
          let upgradeMessage = "";
          if (seatCheck.plan === "free") {
            upgradeMessage = "Free plan allows 1 user. Upgrade to Standard for up to 10 users.";
          } else if (seatCheck.plan === "standard") {
            upgradeMessage = "Standard plan allows 10 users. Upgrade to Elite for unlimited users.";
          } else {
            upgradeMessage = "Seat limit reached. Upgrade your plan to invite more users.";
          }

          toast.error("Seat limit reached", {
            description: upgradeMessage,
          });
          return;
        }

        // Proceed with invite or add
        if (data.inviteMode) {
          inviteUserMutation.mutate({
            name: data.name,
            email: data.email,
            roleId: data.roleId || undefined,
          });
        } else {
          addUserMutation.mutate({
            name: data.name,
            email: data.email,
            roleId: data.roleId || undefined,
          });
        }
      } catch (error) {
        logger.error("Error checking seat limit:", error);
        toast.error("Error checking seat limit", {
          description: "Please try again",
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
    setSelectedUser(u);
    setUserSheetOpen(true);
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
    <div className="animate-fade-in space-y-8">
      {/* Header Region */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Organization Members</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage and track your team members.</p>
          {orgData && usersData && !orgData.is_system && (
            <div className="mt-3 flex items-center gap-2">
              <div className="inline-block px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                <p className="text-xs font-bold text-teal-700 dark:text-teal-400">
                  {usersData.length} / {orgData.seats_limit} seats used
                </p>
              </div>
              {orgData.plan !== 'elite' && usersData.length >= orgData.seats_limit && (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Limit reached</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {canCreate && (
            <Button
              variant="brand"
              onClick={() => {
                setSelectedUser(null);
                setUserSheetOpen(true);
              }}
            >
              <PlusCircle className="w-4 h-4" /> Create User
            </Button>
          )}
        </div>
      </div>
      {/* Search and Filters Bar (Match Leads.tsx Style exactly) */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-accent/20 focus:border-accent placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <StatusTabs<string>
            tabs={roleTabs}
            value={roleFilter}
            onChange={setRoleFilter}
            allLabel="All Users"
          />
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <Button variant="outlineNeutral" className="h-10 px-4 rounded-md font-bold text-xs uppercase tracking-widest">
            <Filter className="w-4 h-4" /> More Filters
          </Button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Member</th>
                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</th>
                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
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
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group border-l-2 border-l-transparent hover:border-l-accent"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar
                          name={u.name || u.email || 'User'}
                          className="size-9 rounded-full shadow-sm text-sm font-bold"
                        />
                        <div>
                          <div className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {u.name}
                            {u.role?.name === 'Admin' && (
                              <span title="Admin User"><Shield className="w-3.5 h-3.5 text-amber-500" /></span>
                            )}
                            {u.authUserId === userId && (
                              <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter h-4 px-1 bg-accent-dim text-accent border-accent/10">You</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium md:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">{u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <UserRoleBadge roleName={u.role?.name} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {(() => {
                          const isProtectedAdmin = u.role?.name === 'Admin' || u.role?.name === 'Super Admin' || !!u.isSuperadmin;
                          const rowCanEdit = isSuperAdmin || (isAdmin && !isProtectedAdmin);
                          const rowCanDelete = isSuperAdmin || (isAdmin && !isProtectedAdmin);

                          return (
                            <>
                              {canUpdate && rowCanEdit && u.authUserId !== user?.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openRoleDialog(u)}
                                  className="text-[11px] h-7 px-3 font-bold text-accent hover:text-accent/80 hover:bg-accent-dim rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Shield className="w-3.5 h-3.5 mr-1" /> Role
                                </Button>
                              )}
                              <UserActionsMenu
                                u={u}
                                currentUserId={user?.id}
                                onChangeRole={() => openRoleDialog(u)}
                                onRemove={() => handleRemoveUser(u)}
                                removePending={removeUserMutation.isPending}
                                canUpdate={canUpdate && rowCanEdit}
                                canDelete={canDelete && rowCanDelete}
                              />
                            </>
                          );
                        })()}
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

      {/* Unified User Sheet */}
      <UserSheet
        open={userSheetOpen}
        onOpenChange={setUserSheetOpen}
        onSave={handleSaveUser}
        initialData={selectedUser}
        availableRoles={availableRoles}
        isPending={inviteUserMutation.isPending || addUserMutation.isPending || updateRoleMutation.isPending}
        organizationId={organizationId}
      />

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
