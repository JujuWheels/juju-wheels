import { useState, useEffect, useRef } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { searchProducts, searchProductsLocally, formatPrice, shopifyImageUrl } from "@/lib/shopify";
import type { Product } from "@/lib/shopify";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Rank a product result by how closely it matches the query.
 *  Lower score = more relevant. */
function relevanceScore(product: Product, query: string): number {
  const q = query.toLowerCase();
  const title = product.title.toLowerCase();
  const desc = (product.description || "").toLowerCase();

  if (title === q) return 0;                        // exact title match
  if (title.startsWith(q)) return 1;               // title starts with query
  if (title.includes(q)) return 2;                 // title contains query
  if (desc.includes(q)) return 3;                  // description contains query
  return 4;                                         // anything else (tags/vendor)
}
const LAST_SEARCH_KEY = "lastSearchQuery";

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<Product[]>([]);
  const [loading, setLoading]       = useState(false);
  const [refining, setRefining]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<CategoryValue>(undefined);
  const inputRef                    = useRef<HTMLInputElement>(null);
  const debouncedQuery              = useDebounce(query.trim(), 300);
  const [, navigate]                = useLocation();

  /* persist query to sessionStorage whenever it changes */
  useEffect(() => {
    if (query) {
      sessionStorage.setItem(LAST_SEARCH_KEY, query);
    }
  }, [query]);

  /* focus input when modal opens; restore last query */
  useEffect(() => {
    if (open) {
      const saved = sessionStorage.getItem(LAST_SEARCH_KEY) || "";
      setQuery(saved);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setError(null);
      setActiveTab(undefined);
    }
  }, [open]);

  /* run search whenever query or tab changes */
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setError(null);
      setLoading(false);
      setRefining(false);
      return;
    }

    let cancelled = false;

    // ── 1. Instant cache results ────────────────────────────────
    const cached = searchProductsLocally(debouncedQuery, activeTab);
    const ranked = (products: Product[]) =>
      [...products].sort(
        (a, b) => relevanceScore(a, debouncedQuery) - relevanceScore(b, debouncedQuery)
      );

    if (cached.length > 0) {
      setResults(ranked(cached));
      setLoading(false);
      setRefining(true);  // show subtle indicator that server is refining
    } else {
      setResults([]);
      setLoading(true);   // cache empty — show full spinner
      setRefining(false);
    }
    setError(null);

    // ── 2. Background server query ──────────────────────────────
    searchProducts(debouncedQuery, activeTab)
      .then((data) => {
        if (!cancelled) {
          setResults(ranked(data));
        }
      })
      .catch(() => {
        // If we already have cache results, keep them and stay silent
        if (!cancelled && cached.length === 0) {
          setError("Search failed — please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefining(false);
        }
      });

    return () => { cancelled = true; };
  }, [debouncedQuery, activeTab]);

  /* close on ESC */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* lock body scroll */
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const hasResults = results.length > 0;
  const showEmpty  = debouncedQuery && !loading && !hasResults && !error;

  function goToAllResults() {
    const params = new URLSearchParams({ q: debouncedQuery });
    if (activeTab) params.set("type", activeTab);
    navigate(`/search?${params.toString()}`);
    onClose();
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col items-center pt-[10vh] px-4"
      onClick={onClose}
      data-testid="search-modal-backdrop"
    >
      {/* Panel */}
      <div
        className="w-full max-w-2xl bg-background border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
        onClick={(e) => e.stopPropagation()}
        data-testid="search-modal"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-5 h-5 text-white/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search wheels by name or size…"
            className="flex-1 bg-transparent text-white placeholder-white/30 font-tech text-sm focus:outline-none"
            data-testid="search-modal-input"
            aria-label="Search products"
          />
          {loading   && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
          {refining  && !loading && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse shrink-0" title="Refining results…" />
          )}
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors shrink-0"
            aria-label="Close search"
            data-testid="search-modal-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category filter tabs — shown when there's a query */}
        {debouncedQuery && (
          <div className="flex gap-0 border-b border-white/10 px-4">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={String(tab.value)}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "py-2 px-3 font-tech text-[10px] uppercase tracking-widest transition-colors border-b-2 -mb-px",
                  activeTab === tab.value
                    ? "border-primary text-primary"
                    : "border-transparent text-white/30 hover:text-white/60"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {(hasResults || showEmpty || error) && (
          <ul
            className="max-h-[50vh] overflow-y-auto divide-y divide-white/5"
            role="listbox"
            aria-label="Search results"
          >
            {error && (
              <li className="px-4 py-8 flex flex-col items-center gap-3">
                <p className="text-red-400 font-tech text-xs text-center">
                  {error}
                </p>
                <Link
                  href="/collections/all"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 font-tech text-xs uppercase tracking-widest text-primary hover:text-white transition-colors border border-primary/40 hover:border-white/40 px-4 py-2"
                >
                  Browse all wheels →
                </Link>
              </li>
            )}
            {showEmpty && (
              <li className="px-4 py-6 text-center text-white/30 font-tech text-xs uppercase tracking-widest">
                No results for &ldquo;{debouncedQuery}&rdquo;
              </li>
            )}
            {results.map((product) => {
              const img   = product.images.edges[0]?.node;
              const price = product.priceRange.minVariantPrice;
              return (
                <li key={product.id} role="option" aria-selected={false}>
                  <Link
                    href={`/products/${product.handle}`}
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors group"
                    data-testid={`search-result-${product.handle}`}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 bg-white/5 shrink-0 overflow-hidden">
                      {img ? (
                        <img
                          src={shopifyImageUrl(img.url, 96, 96)}
                          alt={img.altText || product.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <Search className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Name + price */}
                    <div className="flex-1 min-w-0">
                      <p className="font-tech uppercase tracking-wider text-xs text-white group-hover:text-primary transition-colors truncate">
                        {product.title}
                      </p>
                      {product.productType && (
                        <p className="text-[10px] text-white/30 font-tech uppercase tracking-widest mt-0.5">
                          {product.productType}
                        </p>
                      )}
                    </div>
                    <span className="font-tech text-xs text-primary shrink-0">
                      {formatPrice(price)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer: result count + "View all" */}
        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] font-tech text-white/20 uppercase tracking-widest">
            {hasResults
              ? `${results.length} result${results.length !== 1 ? "s" : ""}`
              : "Type to search"}
          </p>
          <div className="flex items-center gap-4">
            {debouncedQuery && (
              <button
                onClick={goToAllResults}
                className="text-[10px] font-tech text-primary/70 hover:text-primary uppercase tracking-widest transition-colors"
              >
                View all results →
              </button>
            )}
            <p className="text-[10px] font-tech text-white/20 uppercase tracking-widest">
              ESC to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type CategoryValue = (typeof CATEGORY_TABS)[number]["value"];

const CATEGORY_TABS = [
  { label: "All",      value: undefined       },
  { label: "Wheels",   value: "Wheels"        },
  { label: "Parts",    value: "Parts"         },
  { label: "Services", value: "Services"      },
] as const;
