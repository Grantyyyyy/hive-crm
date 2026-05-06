import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
  accentColor?: 'accent' | 'teal' | 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
  badge?: string;
  badgeColor?: 'accent' | 'teal' | 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
  className?: string;
  size?: 'default' | 'compact';
  onClick?: () => void;
}

const colorMap = {
  accent: {
    border: 'border-l-accent',
    hoverShadow: 'hover:shadow-accent/5',
    iconBg: 'bg-accent-dim',
    iconColor: 'text-accent',
  },
  teal: {
    border: 'border-l-teal-600',
    hoverShadow: 'hover:shadow-teal-600/5',
    iconBg: 'bg-teal-600/10',
    iconColor: 'text-teal-600',
  },
  emerald: {
    border: 'border-l-emerald-500',
    hoverShadow: 'hover:shadow-emerald-600/5',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  amber: {
    border: 'border-l-amber-500',
    hoverShadow: 'hover:shadow-amber-500/10',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  rose: {
    border: 'border-l-rose-500',
    hoverShadow: 'hover:shadow-rose-500/10',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
  },
  blue: {
    border: 'border-l-blue-500',
    hoverShadow: 'hover:shadow-blue-500/10',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  slate: {
    border: 'border-l-slate-400',
    hoverShadow: 'hover:shadow-slate-400/5',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
};

const badgeColorMap = {
  accent: 'bg-accent-dim text-accent',
  teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
};

export function StatCard({
  label,
  value,
  icon,
  accentColor = 'accent',
  badge,
  badgeColor = 'accent',
  className,
  size = 'default',
  onClick,
}: StatCardProps) {
  const colors = colorMap[accentColor];
  const badgeColors = badgeColorMap[badgeColor];

  const CardContent = () => (
    <div className={cn(
      "bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-transparent hover:border-l-transparent transition-all hover:shadow-xl group h-full",
      size === 'compact' ? "p-4" : "p-6"
    )}>
      <div className={cn(
        "flex items-center justify-between",
        size === 'compact' ? "mb-4" : "mb-6"
      )}>
        {icon && (
          <div className={cn(
            'rounded flex items-center justify-center transition-transform group-hover:scale-110',
            size === 'compact' ? 'w-8 h-8' : 'w-10 h-10',
            colors.iconBg,
            colors.iconColor
          )}>
            {icon}
          </div>
        )}
        {badge && (
          <div className={cn(
            'px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider shadow-sm',
            badgeColors
          )}>
            {badge}
          </div>
        )}
      </div>
      <div className={cn(size === 'compact' ? "space-y-0.5" : "space-y-1")}>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
        {typeof value === 'string' ? (
          <h3 className={cn(
            "font-extrabold tracking-tight text-slate-900 dark:text-white",
            size === 'compact' ? "text-2xl" : "text-2xl md:text-3xl"
          )}>{value}</h3>
        ) : (
          value
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'block transform transition-all active:scale-95',
          colors.hoverShadow,
          className
        )}
      >
        <CardContent />
      </button>
    );
  }

  return (
    <div className={cn('transition-all', colors.hoverShadow, className)}>
      <CardContent />
    </div>
  );
}
