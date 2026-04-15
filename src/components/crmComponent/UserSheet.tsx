import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { UserForm, type UserFormData } from "./UserForm"
import type { AppUser, Role } from "@/lib/types"

interface UserSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: UserFormData) => void
  initialData?: AppUser | null
  availableRoles: Role[]
  isPending?: boolean
}

export function UserSheet({
  open,
  onOpenChange,
  onSave,
  initialData,
  availableRoles,
  isPending
}: UserSheetProps) {
  const isEditing = !!initialData

  const handleSave = (data: UserFormData) => {
    onSave(data)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
        <SheetHeader className="px-8 pt-8 pb-4 bg-white/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shrink-0">
          <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {isEditing ? "Modify Permissions" : "Add Organization Member"}
          </SheetTitle>
          <SheetDescription className="text-sm font-medium text-slate-500">
            {isEditing
              ? "Update the access levels and role for this team member."
              : "Invite a new member to your organization or add them manually."
            }
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <UserForm
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
            initialData={initialData}
            availableRoles={availableRoles}
            isPending={isPending}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
