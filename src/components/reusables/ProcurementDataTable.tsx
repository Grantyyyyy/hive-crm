import React from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/utils';
import { Layers, Check, Minus } from 'lucide-react';

// ── Column Definition ──────────────────────────────────────────────────────────

export interface ProcurementColumn<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

// ── Props Interface ────────────────────────────────────────────────────────────

interface ProcurementDataTableProps<T extends { id: string | number }> {
  /** Data items to display */
  data: T[];

  /** Column definitions */
  columns: ProcurementColumn<T>[];

  /** Loading state */
  isLoading?: boolean;

  /** Called when a row is clicked (receives the item) */
  onRowClick?: (item: T) => void;

  /** Pagination configuration */
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
    itemLabel?: string;
  };

  /** Empty state customization */
  emptyState?: {
    icon?: React.ReactNode;
    message?: string;
  };

  /** Custom row className (in addition to default hover styles) */
  rowClassName?: string;

  /** Custom table container className */
  className?: string;

  /** Stats cards rendered above the table (optional slot) */
  statsCards?: React.ReactNode;

  /** Search input rendered above the table (optional slot) */
  searchInput?: React.ReactNode;

  /** Filter tabs/buttons rendered above the table (optional slot) */
  filterTabs?: React.ReactNode;

  /** Row selection support (opt-in) */
  selection?: {
    selectedIds: Set<string | number>;
    onToggle: (id: string | number) => void;
    onToggleAll: (allIds: (string | number)[]) => void;
  };

  /** Bulk action bar shown when rows are selected (optional slot) */
  bulkActionBar?: React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ProcurementDataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading = false,
  onRowClick,
  pagination,
  emptyState,
  rowClassName,
  className,
  statsCards,
  searchInput,
  filterTabs,
  selection,
  bulkActionBar,
}: ProcurementDataTableProps<T>) {
  const allPageIds = data.map(item => item.id)
  const allSelected = allPageIds.length > 0 && allPageIds.every(id => selection?.selectedIds.has(id))
  const someSelected = allPageIds.some(id => selection?.selectedIds.has(id))
  const hasSelection = selection && selection.selectedIds.size > 0
  return (
    <div className="space-y-8">
      {/* Stats Cards (optional) */}
      {statsCards}

      {/* Bulk Action Bar */}
      {hasSelection && bulkActionBar && (
        <div className="animate-fade-in">
          {bulkActionBar}
        </div>
      )}

      {/* Search & Filters (optional) */}
      {(searchInput || filterTabs) && (
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          {searchInput}
          {filterTabs}
        </div>
      )}

      {/* Table Container */}
      <div className={cn(
        "bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden",
        className
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                {selection && (
                  <th className="w-12 px-4 py-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); selection.onToggleAll(allPageIds) }}
                      className={cn(
                        "size-[18px] rounded border-2 flex items-center justify-center transition-all duration-150",
                        allSelected
                          ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                          : someSelected
                            ? "bg-teal-600/20 border-teal-600 text-teal-600"
                            : "border-slate-300 dark:border-slate-600 hover:border-teal-500"
                      )}
                    >
                      {allSelected ? <Check className="w-3 h-3" /> : someSelected ? <Minus className="w-3 h-3" /> : null}
                    </button>
                  </th>
                )}
                {columns.map((col, index) => (
                  <th
                    key={index}
                    className={cn(
                      "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400",
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + (selection ? 1 : 0)} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-500 font-medium italic">Loading data...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selection ? 1 : 0)} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      {emptyState?.icon || <Layers className="w-12 h-12 text-slate-200" />}
                      <p className="text-slate-400 font-bold italic">
                        {emptyState?.message || "No items matching your criteria."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const isSelected = selection?.selectedIds.has(item.id)
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onRowClick?.(item)}
                      className={cn(
                        "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer group border-l-2 border-l-transparent hover:border-l-teal-500",
                        onRowClick && "cursor-pointer",
                        isSelected && "bg-teal-50/50 dark:bg-teal-900/10 border-l-teal-500",
                        rowClassName
                      )}
                    >
                      {selection && (
                        <td className="w-12 px-4 py-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); selection.onToggle(item.id) }}
                            className={cn(
                              "size-[18px] rounded border-2 flex items-center justify-center transition-all duration-150",
                              isSelected
                                ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                                : "border-slate-300 dark:border-slate-600 hover:border-teal-500"
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </button>
                        </td>
                      )}
                      {columns.map((col, index) => (
                        <td
                          key={index}
                          className={cn(
                            "px-6 py-4",
                            col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                            col.className
                          )}
                        >
                          {col.render(item)}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            itemLabel={pagination.itemLabel}
          />
        )}
      </div>
    </div>
  );
}
