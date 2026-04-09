import React from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface Column<T> {
  header: React.ReactNode | ((context?: any) => React.ReactNode);
  key?: keyof T | string;
  render?: (item: T) => React.ReactNode;
  headerClassName?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
    itemLabel?: string;
  };
  emptyState?: {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
  };
  className?: string;
  tableClassName?: string;
  rowClassName?: string;
  // DND / Customization Props
  BodyComponent?: React.ComponentType<{ children: React.ReactNode }>;
  RowComponent?: React.ComponentType<{ item: T; children: React.ReactNode; onClick?: () => void; className?: string }>;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading = false,
  onRowClick,
  pagination,
  emptyState,
  className,
  tableClassName,
  rowClassName,
  BodyComponent = ({ children }) => <>{children}</>,
  RowComponent = ({ children, onClick, className }) => <tr onClick={onClick} className={className}>{children}</tr>,
}: DataTableProps<T>) {
  return (
    <div className={cn(
      "bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col",
      className
    )}>
      <div className="overflow-x-auto">
        <table className={cn("w-full text-left table-auto", tableClassName)}>
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={cn(
                    "px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest",
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                    col.headerClassName
                  )}
                >
                  {typeof col.header === 'function' ? col.header() : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <p className="text-slate-500 font-medium">Loading data...</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    {emptyState?.icon && (
                      <div className="text-slate-300 dark:text-slate-700">
                        {emptyState.icon}
                      </div>
                    )}
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                      {emptyState?.title || "No results found matching your selection."}
                    </p>
                    {emptyState?.description && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {emptyState.description}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              <BodyComponent>
                {data.map((item) => (
                  <RowComponent
                    key={item.id}
                    item={item}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all group border-l-2 border-l-transparent hover:border-l-teal-500 relative z-0 hover:z-10",
                      onRowClick && "cursor-pointer",
                      rowClassName
                    )}
                  >
                    {columns.map((col, index) => (
                      <td
                        key={index}
                        className={cn(
                          "px-6 py-4",
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                          col.className
                        )}
                      >
                        {col.render ? col.render(item) : (item[col.key as keyof T] as React.ReactNode)}
                      </td>
                    ))}
                  </RowComponent>
                ))}
              </BodyComponent>
            )}
          </tbody>
        </table>
      </div>

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
  );
}
