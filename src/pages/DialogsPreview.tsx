import { useState } from 'react';
import { DeleteModal } from '@/components/ui/delete-modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { FeatureModal } from '@/components/ui/feature-modal';
import {
  Cloud,
  AlertTriangle,
  Trash2,
  Info,
  CheckCircle,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react';

type ModalVariant = 'teal' | 'amber' | 'warning' | 'info' | 'success' | 'primary';

interface DialogCard {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  accentDot: string;
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant: ModalVariant;
  buttonClass: string;
  type: 'confirm' | 'delete' | 'feature';
}

const DIALOG_CARDS: DialogCard[] = [
  {
    id: 'publish',
    icon: <Cloud className="w-5 h-5" />,
    iconBg: 'bg-teal-50 dark:bg-teal-900/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
    accentDot: 'bg-teal-500',
    label: 'Deployment',
    title: 'Confirm Publication',
    description: 'Push content to the live environment. This will update all public endpoints instantly.',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'teal',
    buttonClass: 'bg-teal-600 hover:bg-teal-700 shadow-teal-200 dark:shadow-none',
    type: 'confirm',
  },
  {
    id: 'discard',
    icon: <AlertTriangle className="w-5 h-5" />,
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accentDot: 'bg-amber-500',
    label: 'Warning',
    title: 'Discard Changes',
    description: 'Progress will be permanently removed. You cannot undo this once you leave the editor.',
    confirmLabel: 'Discard Anyway',
    cancelLabel: 'Keep Editing',
    variant: 'amber',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 dark:shadow-none',
    type: 'confirm',
  },
  {
    id: 'delete',
    icon: <Trash2 className="w-5 h-5" />,
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
    accentDot: 'bg-red-500',
    label: 'Destructive',
    title: 'Delete Record',
    description: 'This action cannot be undone. The selected item will be purged permanently from the database.',
    confirmLabel: 'Delete Forever',
    cancelLabel: 'Keep Record',
    variant: 'teal',
    buttonClass: 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none',
    type: 'delete',
  },
  {
    id: 'warning',
    icon: <AlertTriangle className="w-5 h-5" />,
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    accentDot: 'bg-orange-500',
    label: 'System',
    title: 'Connection Lost',
    description: 'We lost connection to the server. Please check your network and try again.',
    confirmLabel: 'Retry Connection',
    cancelLabel: 'Close',
    variant: 'warning',
    buttonClass: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 dark:shadow-none',
    type: 'confirm',
  },
  {
    id: 'info',
    icon: <Info className="w-5 h-5" />,
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    accentDot: 'bg-blue-500',
    label: 'Information',
    title: 'System Update',
    description: 'A new system update is available. It includes performance improvements and security patches.',
    confirmLabel: 'Update Now',
    cancelLabel: 'Remind Me Later',
    variant: 'info',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none',
    type: 'confirm',
  },
  {
    id: 'success',
    icon: <CheckCircle className="w-5 h-5" />,
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accentDot: 'bg-emerald-500',
    label: 'Success',
    title: 'Payment Processed',
    description: 'Your payment of $49.00 was processed successfully. A receipt has been sent to your email.',
    confirmLabel: 'View Receipt',
    cancelLabel: 'Dismiss',
    variant: 'success',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none',
    type: 'confirm',
  },
  {
    id: 'upgrade',
    icon: <Sparkles className="w-5 h-5" />,
    iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    accentDot: 'bg-indigo-500',
    label: 'Upgrade',
    title: 'Upgrade Your Plan',
    description: 'Unlock advanced features, unlimited API calls, and priority support by upgrading your plan.',
    confirmLabel: 'Upgrade Now',
    cancelLabel: 'Maybe Later',
    variant: 'primary',
    buttonClass: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none',
    type: 'confirm',
  },
  {
    id: 'feature',
    icon: <Zap className="w-5 h-5" />,
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    accentDot: 'bg-purple-500',
    label: 'Announcement',
    title: 'Feature Spotlight',
    description: 'A rich modal for marketing announcements, new features, or premium upgrade prompts.',
    confirmLabel: 'Try it free',
    cancelLabel: 'Dismiss',
    variant: 'primary',
    buttonClass: 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900',
    type: 'feature',
  },
];

export function DialogsPreview() {
  const [openModal, setOpenModal] = useState<string | null>(null);

  const open = (id: string) => setOpenModal(id);
  const close = () => setOpenModal(null);

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="mx-auto p-2 md:p-4 max-w-full animate-fade-in space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-0.5">
              UI Components
            </p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dialog System
            </h1>
          </div>
          <span className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {DIALOG_CARDS.length} variants
          </span>
        </div>

        {/* Dialog list */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Available Modals
            </h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {DIALOG_CARDS.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-default border-l-4 border-transparent hover:border-teal-600"
              >
                {/* Icon */}
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${card.iconBg} ${card.iconColor}`}>
                  <span className="w-3.5 h-3.5 [&>svg]:w-3.5 [&>svg]:h-3.5">{card.icon}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span
                    className={`
                      shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest
                      ${card.id === 'publish' ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : ''}
                      ${card.id === 'discard' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : ''}
                      ${card.id === 'delete' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : ''}
                      ${card.id === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : ''}
                      ${card.id === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : ''}
                      ${card.id === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : ''}
                      ${card.id === 'upgrade' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : ''}
                      ${card.id === 'feature' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : ''}
                    `}
                  >
                    {card.label}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {card.title}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate hidden md:block">
                    — {card.description}
                  </span>
                </div>

                {/* CTA */}
                <button
                  onClick={() => open(card.id)}
                  className={`
                    shrink-0 flex items-center gap-1 px-3 py-1.5
                    text-white text-[10px] font-bold uppercase tracking-wider
                    rounded-lg shadow-sm transition-all
                    ${card.buttonClass}
                  `}
                >
                  Preview
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <ConfirmModal
        open={openModal === 'publish'}
        onOpenChange={(v) => !v && close()}
        title="Confirm Publication"
        description="Push content to the live environment. This will update all public endpoints instantly."
        confirmLabel="Confirm"
        variant="teal"
        onConfirm={close}
      />

      <ConfirmModal
        open={openModal === 'discard'}
        onOpenChange={(v) => !v && close()}
        title="Discard Changes"
        description="Progress will be permanently removed. You cannot undo this once you leave the editor."
        confirmLabel="Discard Anyway"
        cancelLabel="Keep Editing"
        variant="amber"
        onConfirm={close}
      />

      <DeleteModal
        open={openModal === 'delete'}
        onOpenChange={(v) => !v && close()}
        title="Delete Record"
        description="This action cannot be undone. The selected item will be purged permanently from the database."
        deleteText="Delete Forever"
        cancelText="Keep Record"
        onDelete={close}
      />

      <ConfirmModal
        open={openModal === 'warning'}
        onOpenChange={(v) => !v && close()}
        title="Connection Lost"
        description="We lost connection to the server. Please check your network and try again."
        confirmLabel="Retry Connection"
        cancelLabel="Close"
        variant="warning"
        onConfirm={close}
      />

      <ConfirmModal
        open={openModal === 'info'}
        onOpenChange={(v) => !v && close()}
        title="System Update"
        description="A new system update is available. It includes performance improvements and security patches."
        confirmLabel="Update Now"
        cancelLabel="Remind Me Later"
        variant="info"
        onConfirm={close}
      />

      <ConfirmModal
        open={openModal === 'success'}
        onOpenChange={(v) => !v && close()}
        title="Payment Processed"
        description="Your payment of $49.00 was processed successfully. A receipt has been sent to your email."
        confirmLabel="View Receipt"
        cancelLabel="Dismiss"
        variant="success"
        onConfirm={close}
      />

      <ConfirmModal
        open={openModal === 'upgrade'}
        onOpenChange={(v) => !v && close()}
        title="Upgrade Your Plan"
        description="Unlock advanced features, unlimited API calls, and priority support by upgrading your plan."
        confirmLabel="Upgrade Now"
        cancelLabel="Maybe Later"
        variant="primary"
        onConfirm={close}
      />

      <FeatureModal
        open={openModal === 'feature'}
        onOpenChange={(v) => !v && close()}
        title="Introducing Supercharge"
        description="Access lightning-fast AI models, unlimited requests, and a dedicated success manager."
        actionLabel="Try it for free"
        onAction={close}
      />
    </div>
  );
}