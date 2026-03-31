import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
  itemLabel?: string
  className?: string
}

/**
 * Standard Numeric Pagination — synchronized with the CRM's Teal-600 design system.
 * Renders a sophisticated footer row with "Showing X–Y of Z" and numeric controls.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemLabel = "items",
  className,
}: PaginationProps) {
  const hasItems = totalItems == null || totalItems > 0
  if (!hasItems) return null

  const showControls = totalPages > 1

  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1)
    }

    const pages: (number | "ellipsis")[] = []

    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "ellipsis", totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages)
    }

    return pages
  }

  const pageNumbers = showControls ? getPageNumbers() : []

  const rangeStart =
    totalItems != null && itemsPerPage != null
      ? Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
      : undefined
  const rangeEnd =
    totalItems != null && itemsPerPage != null
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : undefined

  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-slate-100 dark:border-slate-800",
        "bg-slate-50/50 dark:bg-slate-900/50",
        "flex flex-col sm:flex-row items-center justify-between gap-4",
        className
      )}
    >
      {/* Left: Metadata */}
      <div className="flex items-center gap-2">
        {rangeStart != null && rangeEnd != null && totalItems != null ? (
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
            Showing{" "}
            <span className="text-slate-900 dark:text-slate-100">
              {rangeStart}—{rangeEnd}
            </span>{" "}
            of{" "}
            <span className="text-slate-900 dark:text-slate-100">{totalItems}</span>{" "}
            {itemLabel}
          </p>
        ) : (
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
            Page{" "}
            <span className="text-slate-900 dark:text-slate-100 font-bold">{currentPage}</span>{" "}
            of{" "}
            <span className="text-slate-900 dark:text-slate-100 font-bold">{Math.max(totalPages, 1)}</span>
          </p>
        )}
      </div>

      {/* Right: Controls */}
      {showControls && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {pageNumbers.map((page, idx) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="h-8 w-8 flex items-center justify-center text-slate-300 dark:text-slate-600"
              >
                <MoreHorizontal className="w-4 h-4" />
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-md text-[11px] font-black transition-all",
                  currentPage === page 
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20" 
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            )
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
