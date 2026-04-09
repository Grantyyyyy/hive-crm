import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
  showText?: boolean;
}

export function BackButton({ 
  href, 
  label = "Back", 
  className,
  showText = true 
}: BackButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors group",
        className
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-all">
        <ArrowLeft className="h-4 w-4" />
      </div>
      {showText && <span>{label}</span>}
    </Link>
  );
}
