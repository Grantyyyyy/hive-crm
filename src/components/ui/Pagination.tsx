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
 * Standard Numeric Pagination — mirrors the "Standard Numeric" variant
 * from the Stitch Pagination Showcase design system.
 *
 * Always renders a footer row with "Showing X–Y of Z" info.
 * Navigation controls (numbered buttons + arrows) only appear when
 * there is more than one page.
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
  // Hide entirely only when there are zero items
  const hasItems = totalItems == null || totalItems > 0
  if (!hasItems) return null

  const showControls = totalPages > 1

  // Build visible page numbers with ellipsis (only needed when multi-page)
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1)
    }

    const pages: (number | "ellipsis")[] = []

    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "ellipsis", totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(
        1,
        "ellipsis",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      )
    } else {
      pages.push(
        1,
        "ellipsis",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis",
        totalPages
      )
    }

    return pages
  }

  const pageNumbers = showControls ? getPageNumbers() : []

  // Compute "Showing X–Y of Z" range
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
        "bg-slate-50/30 dark:bg-slate-800/20",
        "flex flex-col sm:flex-row items-center justify-between gap-3",
        className
      )}
    >
      {/* Left: row count info */}
      {rangeStart != null && rangeEnd != null && totalItems != null ? (
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Showing{" "}
          <span className="text-slate-600 dark:text-slate-300">
            {rangeStart}–{rangeEnd}
          </span>{" "}
          of{" "}
          <span className="text-slate-600 dark:text-slate-300">{totalItems}</span>{" "}
          {itemLabel}
        </p>
      ) : (
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Page{" "}
          <span className="text-slate-600 dark:text-slate-300">{currentPage}</span>{" "}
          of{" "}
          <span className="text-slate-600 dark:text-slate-300">{Math.max(totalPages, 1)}</span>
        </p>
      )}

      {/* Right: numeric controls — only when there are multiple pages */}
      {showControls && (
        <div className="flex items-center gap-1">
          {/* Previous */}
          <Button
            variant="outlineNeutral"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Numbered pages */}
          {pageNumbers.map((page, idx) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="h-8 w-8 flex items-center justify-center text-slate-400 dark:text-slate-500"
              >
                <MoreHorizontal className="w-4 h-4" />
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg text-xs font-bold",
                  currentPage === page &&
                    "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none"
                )}
                onClick={() => onPageChange(page as number)}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            )
          )}

          {/* Next */}
          <Button
            variant="outlineNeutral"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
