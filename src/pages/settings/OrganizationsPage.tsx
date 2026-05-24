import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { usePermission } from '@/lib/usePermission';
import { useCRMContext } from '@/lib/CRMContext';
import { useCRMResource } from '@/lib/hooks';
import { supabase } from '@/lib/supabaseClient';
import {
  Building2,
  PlusCircle,
  Search,
  MoreVertical,
  Trash2,
  Edit2,
  Users,
  ChevronDown,
  ChevronRight,
  Loader2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { DeleteModal } from "@/components/ui/delete-modal";
import { BackButton } from "@/components/reusables/BackButton";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SettingsHeader } from "@/components/reusables/SettingsHeader";
import type { Organization, CreateOrganizationInput, AppUser } from '@/lib/types';
import { format } from 'date-fns';

// ── Members List Component ───────────────────────────────────────────────────

function OrganizationMembers({ organizationId }: { organizationId: string }) {
  const { data: allUsers, isLoaded } = useCRMResource<AppUser>('users');

  const members = useMemo(() => {
    return allUsers.filter(u => u.organizationId === organizationId);
  }, [allUsers, organizationId]);

  if (!isLoaded) return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-5 h-5 animate-spin text-accent" />
    </div>
  );

  if (members.length === 0) return (
    <div className="p-8 text-center text-slate-500 text-xs font-medium uppercase tracking-wider italic">
      No members in this organization.
    </div>
  );

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/30 px-6 py-4 border-y border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="max-w-4xl">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-3.5 h-3.5 text-accent" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active Members</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{member.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{member.email}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent">
                {member.role?.name || 'User'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export function OrganizationsPage() {
  const { userId, organizationId: currentOrgId, isLoaded: authLoaded } = useAuth();
  const { roleName, isLoaded: permLoaded } = usePermission();
  const ctx = useCRMContext();
  const { data: orgs, isLoaded: orgsLoaded, setData: setOrgsData, deleteItem, updateItem } = useCRMResource<Organization>('organizations');
  const { data: allUsers } = useCRMResource<AppUser>('users');

  const isSuperAdmin = useMemo(() => roleName === 'Super Admin', [roleName]);
  const isAdmin = useMemo(() => roleName === 'Admin' || isSuperAdmin, [roleName, isSuperAdmin]);

  const [search, setSearch] = useState("");
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [newOrg, setNewOrg] = useState<Partial<Organization>>({ name: '', slug: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [isPending, setIsPending] = useState(false);

  const orgsWithCounts = useMemo(() => {
    return orgs.map(org => {
      const memberCount = allUsers.filter(u => u.organizationId === org.id).length;
      return { ...org, memberCount };
    });
  }, [orgs, allUsers]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string, isEdit = false) => {
    const slug = generateSlug(name);
    if (isEdit && editingOrg) {
      setEditingOrg({ ...editingOrg, name, slug });
    } else {
      setNewOrg({ ...newOrg, name, slug });
    }
  };

  const filteredOrgs = useMemo(() => {
    return orgsWithCounts.filter(o =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [orgsWithCounts, search]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrg.name && newOrg.slug) {
      setIsPending(true);
      try {
        await ctx.runAtomicUpdate([{
          resource: 'organizations',
          action: 'insert',
          patch: { name: newOrg.name, slug: newOrg.slug },
        }]);
        setShowAddDialog(false);
        setNewOrg({ name: '', slug: '' });
        toast.success('Organization created successfully');
      } catch (error: any) {
        toast.error('Failed to create organization', { description: error.message });
      } finally {
        setIsPending(false);
      }
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrg && editingOrg.name && editingOrg.slug) {
      setIsPending(true);
      try {
        await updateItem(editingOrg.id, { name: editingOrg.name, slug: editingOrg.slug });
        setShowEditDialog(false);
        setEditingOrg(null);
        toast.success('Organization updated successfully');
      } catch (error: any) {
        toast.error('Failed to update organization', { description: error.message });
      } finally {
        setIsPending(false);
      }
    }
  };

  const handleDeleteOrg = async () => {
    if (orgToDelete) {
      setIsPending(true);
      try {
        await deleteItem(orgToDelete.id);
        setShowDeleteModal(false);
        setOrgToDelete(null);
        toast.success('Organization deleted successfully');
      } catch (error: any) {
        toast.error('Failed to delete organization', { description: error.message });
      } finally {
        setIsPending(false);
      }
    }
  };

  if (!authLoaded || !permLoaded || !orgsLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8 text-center">
        <div className="size-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-slate-500 max-w-sm mb-8">You need administrator privileges to access organization management settings.</p>
        <BackButton href="/dashboard" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <SettingsHeader 
        category="System Configuration"
        title="Tenants & Organizations"
        actions={
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-accent/20 focus:border-accent placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            {isSuperAdmin && (
              <Button
                variant="brand"
                onClick={() => setShowAddDialog(true)}
                className="shadow-md shadow-accent/10 dark:shadow-none w-full sm:w-auto h-10"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> New Organization
              </Button>
            )}
          </div>
        }
      />

      {/* Main Content Card */}
      <Card className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="w-12 px-4 py-3"></th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-tight text-slate-400">Organization Name</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-tight text-slate-400">URL Slug</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-tight text-slate-400">Members</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-tight text-slate-400">Created At</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-tight text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="w-10 h-10 text-slate-200" />
                      <p className="text-slate-500 font-medium">No organizations found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <React.Fragment key={org.id}>
                    <tr
                      className={cn(
                        "hover:bg-slate-50 dark:hover:bg-slate-800/30 border-l-4 border-transparent hover:border-accent transition-all cursor-pointer group",
                        expandedOrgId === org.id && "bg-slate-50/50 dark:bg-slate-800/20 border-accent"
                      )}
                      onClick={() => setExpandedOrgId(expandedOrgId === org.id ? null : org.id)}
                    >
                      <td className="px-4 py-4 text-center">
                        {expandedOrgId === org.id ? (
                          <ChevronDown className="w-4 h-4 text-accent" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-accent" />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{org.name}</p>
                            {org.id === currentOrgId && (
                              <Badge className="text-[9px] font-black uppercase tracking-widest bg-accent-dim text-accent border-accent/10 mt-0.5">Your Organization</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <code className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">/{org.slug}</code>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{org.memberCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-slate-500 font-medium">{format(new Date(org.createdAt), 'MMM d, yyyy')}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-slate-400 hover:text-accent hover:bg-accent-dim"
                            onClick={() => {
                              setEditingOrg(org);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                              onClick={() => {
                                setOrgToDelete(org);
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedOrgId === org.id && (
                      <tr>
                        <td colSpan={6} className="p-0 border-none">
                          <OrganizationMembers organizationId={org.id} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Organization Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Register New Organization</DialogTitle>
            <DialogDescription>Create a new multi-tenant partition for the CRM.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrg}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Legal Entity Name</Label>
                <Input
                  id="name"
                  placeholder="Acme Corporation"
                  className="h-12 rounded-xl focus:ring-4 focus:ring-accent/20 focus:border-accent"
                  value={newOrg.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-wider text-slate-500">Identifier (Slug)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">crm.app/</span>
                  <Input
                    id="slug"
                    className="h-12 pl-20 rounded-xl focus:ring-4 focus:ring-accent/20 focus:border-accent"
                    value={newOrg.slug}
                    onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Lowercase alphanumeric characters and hyphens only.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="h-11 rounded-xl uppercase text-xs font-bold">Cancel</Button>
              <Button
                type="submit"
                className="h-11 rounded-xl bg-accent hover:bg-accent/90 text-white uppercase text-xs font-bold shadow-lg shadow-accent/20 dark:shadow-none min-w-[120px]"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Partition'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Organization</DialogTitle>
            <DialogDescription>Update the identifier or name for this tenant.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateOrg}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Legal Entity Name</Label>
                <Input
                  id="edit-name"
                  className="h-12 rounded-xl"
                  value={editingOrg?.name || ''}
                  onChange={(e) => handleNameChange(e.target.value, true)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug" className="text-xs font-bold uppercase tracking-wider text-slate-500">Identifier (Slug)</Label>
                <Input
                  id="edit-slug"
                  className="h-12 rounded-xl"
                  value={editingOrg?.slug || ''}
                  onChange={(e) => setEditingOrg(prev => prev ? { ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') } : null)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="h-11 rounded-xl uppercase text-xs font-bold">Cancel</Button>
              <Button
                type="submit"
                className="h-11 rounded-xl bg-accent hover:bg-accent/90 text-white uppercase text-xs font-bold"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Modal */}
      <DeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Organization"
        description={
          <div className="space-y-3">
            <p>Are you sure you want to permanently delete <span className="font-bold text-slate-900 dark:text-white">{orgToDelete?.name}</span>?</p>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Member Verification</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400/80">
                Member count: <span className="font-black">{(orgToDelete?.memberCount || 0)}</span>
              </p>
              {(orgToDelete?.memberCount || 0) > 0 && (
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 mt-2 uppercase tracking-tight italic">
                  Critical: Cannot delete an organization with active members.
                </p>
              )}
            </div>
          </div>
        }
        onDelete={handleDeleteOrg}
        loading={isPending}
        disabled={(orgToDelete?.memberCount || 0) > 0}
      />
    </div>
  );
}
