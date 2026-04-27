import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Users, Handshake, FileText, ShoppingBag, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useCRMResource } from "@/lib/hooks";
import type { Contact, Deal, Quote, SalesOrder } from "@/lib/types";

// Custom hook for debouncing the search query
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200); // 200ms debounce
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch from unified CRM cache (data is already synced with backend via CRMProvider)
  const { data: contacts } = useCRMResource<Contact>("contacts");
  const { data: deals } = useCRMResource<Deal>("deals");
  const { data: quotes } = useCRMResource<Quote>("quotes");
  const { data: orders } = useCRMResource<SalesOrder>("orders");

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  // Unified Search Results
  const filteredResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];

    const lowerQ = debouncedQuery.toLowerCase();
    const results: Array<{ id: string; type: string; title: string; subtitle: string; icon: any; href: string }> = [];

    // Filter Contacts
    contacts.forEach(c => {
      const matchName = c.name?.toLowerCase().includes(lowerQ);
      const matchEmail = c.email?.toLowerCase().includes(lowerQ);
      const matchCompany = c.company?.toLowerCase().includes(lowerQ);
      
      if (matchName || matchEmail || matchCompany) {
        results.push({
          id: c.id,
          type: "contact",
          title: c.name || "Unknown Contact",
          subtitle: c.company || c.email || "Contact",
          icon: Users,
          href: `/contacts/${c.id}`
        });
      }
    });

    // Filter Deals
    deals.forEach(d => {
      const matchTitle = d.title?.toLowerCase().includes(lowerQ);
      if (matchTitle) {
        results.push({
          id: d.id,
          type: "deal",
          title: d.title || "Untitled Deal",
          subtitle: d.value ? `$${Number(d.value).toLocaleString()}` : "Deal",
          icon: Handshake,
          href: `/deals/${d.id}`
        });
      }
    });

    // Filter Quotes
    quotes.forEach(q => {
      const matchNumber = q.quoteNumber?.toLowerCase().includes(lowerQ);
      const matchCustomer = q.customerName?.toLowerCase().includes(lowerQ);
      if (matchNumber || matchCustomer) {
        results.push({
          id: q.id,
          type: "quote",
          title: q.quoteNumber || "Quote",
          subtitle: q.customerName || "No Customer",
          icon: FileText,
          href: `/quotes/${q.id}`
        });
      }
    });

    // Filter Orders
    orders.forEach(o => {
      const matchNumber = o.orderNumber?.toLowerCase().includes(lowerQ);
      const matchCustomer = o.customerName?.toLowerCase().includes(lowerQ);
      if (matchNumber || matchCustomer) {
        results.push({
          id: o.id,
          type: "order",
          title: o.orderNumber || "Order",
          subtitle: o.customerName || "No Customer",
          icon: ShoppingBag,
          href: `/orders/${o.id}`
        });
      }
    });

    // Limit to top 15 results to keep DOM light and snappy
    return results.slice(0, 15);
  }, [debouncedQuery, contacts, deals, quotes, orders]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-[550px] overflow-hidden bg-bg-surface border-border shadow-2xl" showClose={false}>
        <div className="flex items-center px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-text-muted mr-3" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted text-lg"
            placeholder="Search contacts, deals, quotes, or orders..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-[10px] font-bold text-text-muted bg-bg-elevated border border-border px-1.5 py-0.5 rounded uppercase tracking-wider">
            ESC
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query && filteredResults.length === 0 ? (
            <div className="py-14 text-center text-text-muted">
              <Search className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p>No results found for "{query}"</p>
            </div>
          ) : !query ? (
            <div className="py-14 text-center text-text-muted">
              <Search className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p>Type a search term to find records...</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-bold text-text-muted uppercase tracking-wider flex justify-between">
                <span>Suggestions</span>
                <span className="text-text-muted/60">{filteredResults.length} results</span>
              </div>
              {filteredResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    onOpenChange(false);
                    setLocation(result.href);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-elevated transition-all group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all">
                      <result.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-text-primary">{result.title}</div>
                      <div className="text-sm font-medium text-text-muted">{result.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
