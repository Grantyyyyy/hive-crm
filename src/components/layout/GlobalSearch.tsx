import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Users, Handshake, FileText, ShoppingBag, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useCRMResource } from "@/lib/hooks";
import type { Contact, Deal, Quote, SalesOrder } from "@/lib/types";

interface SearchableItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  searchText: string;
  icon: any;
  href: string;
}

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
  const debouncedQuery = useDebounce(query, 200);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: contacts, isLoaded: contactsLoaded } = useCRMResource<Contact>("contacts");
  const { data: deals, isLoaded: dealsLoaded } = useCRMResource<Deal>("deals");
  const { data: quotes, isLoaded: quotesLoaded } = useCRMResource<Quote>("quotes");
  const { data: orders, isLoaded: ordersLoaded } = useCRMResource<SalesOrder>("orders");

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  // Pre-build flat searchable index — only runs when data changes, not on every keystroke
  const searchIndex = useMemo<SearchableItem[]>(() => {
    const items: SearchableItem[] = [];

    for (const c of contacts) {
      items.push({
        id: c.id,
        type: "contact",
        title: c.name || "Unknown Contact",
        subtitle: c.company || c.email || "Contact",
        searchText: `${c.name} ${c.email ?? ""} ${c.company ?? ""}`.toLowerCase(),
        icon: Users,
        href: `/contacts/${c.id}`
      });
    }

    for (const d of deals) {
      items.push({
        id: d.id,
        type: "deal",
        title: d.title || "Untitled Deal",
        subtitle: d.value ? `$${Number(d.value).toLocaleString()}` : "Deal",
        searchText: `${d.title}`.toLowerCase(),
        icon: Handshake,
        href: `/deals/${d.id}`
      });
    }

    for (const q of quotes) {
      items.push({
        id: q.id,
        type: "quote",
        title: q.quoteNumber || "Quote",
        subtitle: q.customerName || "No Customer",
        searchText: `${q.quoteNumber} ${q.customerName ?? ""}`.toLowerCase(),
        icon: FileText,
        href: `/quotes/${q.id}`
      });
    }

    for (const o of orders) {
      items.push({
        id: o.id,
        type: "order",
        title: o.orderNumber || "Order",
        subtitle: o.customerName || "No Customer",
        searchText: `${o.orderNumber} ${o.customerName ?? ""}`.toLowerCase(),
        icon: ShoppingBag,
        href: `/orders/${o.id}`
      });
    }

    return items;
  }, [contactsLoaded, dealsLoaded, quotesLoaded, ordersLoaded]);

  // Fast search — single includes() check per item against pre-computed text
  const filteredResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];

    const lowerQ = debouncedQuery.toLowerCase();
    const results: SearchableItem[] = [];

    for (const item of searchIndex) {
      if (item.searchText.includes(lowerQ)) {
        results.push(item);
        if (results.length >= 15) break;
      }
    }

    return results;
  }, [debouncedQuery, searchIndex]);

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
