import React, { useState, useMemo } from 'react';
import { useCRMResource } from '@/lib/hooks';
import type { Discount, DiscountType, DiscountScope } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from '@/components/ui/textarea';
import {
  Tag,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListSkeleton } from "@/components/ui/skeletons";
import { toast } from 'sonner';
import { DeleteModal } from "@/components/ui/delete-modal";
import { Switch } from '@/components/ui/switch';
import { generateId } from '@/lib/helpers';
import { PageHeader } from "@/components/reusables/PageHeader";

export function Discounts() {
  const { data: discounts, isLoaded, addItems, updateItem, deleteItem } = useCRMResource<Discount>('discounts');

  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    type: DiscountType;
    value: number;
    scope: DiscountScope;
    description: string;
    minOrderAmount: number | '';
    maxDiscountAmount: number | '';
    isActive: boolean;
  }>({
    name: '',
    type: 'percentage',
    value: 0,
    scope: 'line_item',
    description: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    isActive: true,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<Discount | null>(null);

  const filteredDiscounts = useMemo(() => {
    return discounts.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [discounts, search]);

  const resetForm = () => {
    setShowDialog(false);
    setEditingDiscount(null);
    setFormData({
      name: '',
      type: 'percentage',
      value: 0,
      scope: 'line_item',
      description: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      isActive: true,
    });
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      type: discount.type,
      value: discount.value,
      scope: discount.scope,
      description: discount.description || '',
      minOrderAmount: discount.minOrderAmount || '',
      maxDiscountAmount: discount.maxDiscountAmount || '',
      isActive: discount.isActive,
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        value: Number(formData.value) || 0,
        scope: formData.scope,
        description: formData.description,
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        isActive: formData.isActive,
      };

      if (editingDiscount) {
        await updateItem(editingDiscount.id, payload);
      } else {
        await addItems([{
          ...payload,
          id: generateId(),
          isSystem: false,
        } as any]);
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save discount");
    }
  };

  const handleDelete = (discount: Discount) => {
    setDiscountToDelete(discount);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (discountToDelete) {
      try {
        await deleteItem(discountToDelete.id);
        setShowDeleteModal(false);
        setDiscountToDelete(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete discount");
      }
    }
  };

  const toggleActive = async (discount: Discount, active: boolean) => {
    try {
      await updateItem(discount.id, { isActive: active }, true);
      toast.success(`${discount.name} is now ${active ? 'active' : 'inactive'}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (!isLoaded) return <ListSkeleton />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        category="Sales Configuration"
        title="Discount Management"
        description="Create and manage reusable pricing discounts and privileges."
        className="px-0 bg-transparent border-none pb-2"
        actions={
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            {/* Minimized Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search discounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm text-sm font-medium focus:ring-4 focus:ring-accent/20 focus:border-accent placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <Button
              variant="brand"
              onClick={() => setShowDialog(true)}
              className="shadow-md shadow-accent/10 dark:shadow-none w-full sm:w-auto h-10"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Add Discount
            </Button>
          </div>
        }
      />

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDiscounts.map((discount) => (
          <div
            key={discount.id}
            className={cn(
              "group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-0 shadow-sm hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500",
              !discount.isActive && "opacity-75 grayscale-[0.5]"
            )}
          >
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 p-8 -mr-8 -mt-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
              <Tag className="size-32 rotate-12 text-accent" />
            </div>

            <div className="p-6 h-full flex flex-col relative">
              {/* Header: Name, System Badge, Switch */}
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                      {discount.name}
                    </h3>
                    {discount.isSystem && (
                      <Badge className="h-4 text-[8px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-400 border-none px-1.5">System</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border",
                      discount.scope === 'order'
                        ? "bg-accent-dim text-accent border-accent/10"
                        : "bg-accent-dim text-accent border-accent/10"
                    )}>
                      {discount.scope === 'order' ? 'Whole Order' : 'Line Item'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <Switch
                    checked={discount.isActive}
                    onCheckedChange={(checked) => toggleActive(discount, checked)}
                    className="data-[state=checked]:bg-accent"
                  />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-accent-dim text-slate-400 hover:text-accent transition-colors" onClick={() => handleEdit(discount)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    {!discount.isSystem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition-colors"
                        onClick={() => handleDelete(discount)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Discount Value Section */}
              <div className="flex items-center gap-4 mb-6">
                <div className="size-14 rounded-2xl bg-accent-dim flex items-center justify-center text-accent shadow-inner">
                  <Tag className="w-7 h-7" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {discount.type === 'fixed' ? '$' : ''}{discount.value}{discount.type === 'percentage' ? '%' : ''}
                    </span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Off</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {discount.type === 'fixed' ? 'Flat Deduction' : 'Percentage Reduction'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {discount.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 min-h-[40px] italic">
                  "{discount.description}"
                </p>
              )}

              {/* Bottom Info Grid */}
              <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Requirement</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {discount.minOrderAmount ? `$${discount.minOrderAmount}` : 'No Minimum'}
                  </p>
                </div>
                {discount.type === 'percentage' && (
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Maximum Cap</p>
                    <p className="text-sm font-bold text-accent">
                      {discount.maxDiscountAmount ? `$${discount.maxDiscountAmount}` : 'No Limit'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDiscounts.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-20 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              <Lock className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-white font-bold text-lg">No discounts found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search or create a new discount.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDialog(true)}
              className="mt-4"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Add Discount
            </Button>
          </div>
        </div>
      )}

      {/* Form Sheet */}
      <Sheet open={showDialog} onOpenChange={(v) => !v && resetForm()}>
        <SheetContent className="p-0 flex flex-col">
          <SheetHeader className="px-8 pt-8 pb-4 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight">{editingDiscount ? 'Edit Discount' : 'Create Discount'}</SheetTitle>
            <SheetDescription className="text-xs font-medium">
              {editingDiscount ? 'Modify existing discount rules and thresholds.' : 'Define new pricing rules for your sales workflow.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-8 py-4">
            <form id="discount-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Discount Name</Label>
                  <Input
                    className="rounded-md"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Summer Sale, Wholesale Tier 1"
                    disabled={editingDiscount?.isSystem}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as DiscountType })}
                      className="w-full h-10 pl-3 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm appearance-none outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Value {formData.type === 'percentage' ? '(%)' : '($)'}</Label>
                  <Input
                    className="rounded-md"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Scope</Label>
                  <div className="relative">
                    <select
                      value={formData.scope}
                      onChange={e => setFormData({ ...formData, scope: e.target.value as DiscountScope })}
                      className="w-full h-10 pl-3 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm appearance-none outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    >
                      <option value="line_item">Line Item (Per Product)</option>
                      <option value="order">Whole Order (Subtotal)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2 pt-8">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={checked => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Internal notes about when to apply this discount..."
                    className="resize-none rounded-md"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Min Order Amount ($)</Label>
                  <Input
                    className="rounded-md"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value ? parseFloat(e.target.value) : '' })}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Discount Cap ($)</Label>
                  <Input
                    className="rounded-md"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxDiscountAmount}
                    onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : '' })}
                    placeholder="Optional"
                    disabled={formData.type === 'fixed'}
                  />
                </div>
              </div>
            </form>
          </div>

          <SheetFooter className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <Button type="button" variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
            <Button type="submit" form="discount-form" variant="brand" className="flex-1">Save Discount</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Discount"
        description={<>Are you sure you want to delete <b>{discountToDelete?.name}</b>? This action cannot be undone.</>}
        onDelete={confirmDelete}
      />
    </div>
  );
}
