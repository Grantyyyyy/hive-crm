import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { LeadForm } from "./LeadForm"
import type { Lead } from "@/lib/types"

interface LeadSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLead?: Lead | null
  userId: string
  onSave: (lead: Lead) => void
}

export function LeadSheet({
  open,
  onOpenChange,
  editingLead,
  userId,
  onSave
}: LeadSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
        <SheetHeader className="px-8 pt-8 pb-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shrink-0">
          <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {editingLead ? "Edit Lead" : "Add New Lead"}
          </SheetTitle>
          <SheetDescription className="text-sm font-medium text-slate-500">
            {editingLead
              ? "Update the details for this sales prospect."
              : "Fill in the information to create a new sales prospect."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <LeadForm
            userId={userId}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
            initialData={editingLead ?? undefined}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
