import React from 'react';
import { cn } from "@/lib/utils";

interface SettingsHeaderProps {
  title: string;
  category?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * A minimized header component for settings sub-pages.
 * Based on the Billing page header design.
 */
export function SettingsHeader({ title, category = "Settings", actions, children, className }: SettingsHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {category && (
            <div className="mt-1.5">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-slate-700">
                {category}
              </span>
            </div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      {children && (
        <div className="mt-1">
          {children}
        </div>
      )}
    </div>
  );
}
