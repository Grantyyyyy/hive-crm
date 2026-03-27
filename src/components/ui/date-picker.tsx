
import { format, isValid, parseISO } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({ 
  value, 
  onChange, 
  className,
  disabled,
  showIcon = true 
}: { 
  value?: Date | string; 
  onChange?: (date: string) => void;
  className?: string;
  disabled?: boolean;
  showIcon?: boolean;
}) {
  const parsedDate = typeof value === 'string' ? parseISO(value) : (value instanceof Date ? value : undefined)
  const dateValue = parsedDate && isValid(parsedDate) ? parsedDate : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          {showIcon && <CalendarIcon className="mr-2 h-4 w-4" />}
          {dateValue ? format(dateValue, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(d) => onChange?.(d ? format(d, 'yyyy-MM-dd') : '')}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
