import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ContactForm } from "./ContactForm"
import type { Contact, CreateContactInput } from "@/lib/types"

interface EditContactSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingContact?: Contact | null
  onSave: (contact: CreateContactInput) => void
}

export function EditContactSheet({
  open,
  onOpenChange,
  editingContact,
  onSave
}: EditContactSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
        <SheetHeader className="px-8 pt-8 pb-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shrink-0">
          <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {editingContact ? "Edit Contact" : "Add New Contact"}
          </SheetTitle>
          <SheetDescription className="text-sm font-medium text-slate-500">
            {editingContact
              ? "Update the details for this contact."
              : "Fill in the information to create a new professional contact."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <ContactForm
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
            initialData={editingContact ?? undefined}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
