import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusTab<T extends string> {
  value: T;
  label: string;
}

interface StatusTabsProps<T extends string> {
  tabs: StatusTab<T>[];
  value: T | 'all';
  onChange: (value: T | 'all') => void;
  allLabel?: string;
  className?: string;
}

export function StatusTabs<T extends string>({
  tabs,
  value,
  onChange,
  allLabel = 'All',
  className,
}: StatusTabsProps<T>) {
  return (
    <div className={cn(
      'bg-white dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-800 w-fit flex items-center',
      className
    )}>
      <button
        onClick={() => onChange('all')}
        className={cn(
          'h-8 px-5 rounded-md text-xs font-bold transition-all whitespace-nowrap',
          value === 'all'
            ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
        )}
      >
        {allLabel}
      </button>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'h-8 px-5 rounded-md text-xs font-bold transition-all whitespace-nowrap',
            value === tab.value
              ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
