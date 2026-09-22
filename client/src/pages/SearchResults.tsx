import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Search, Loader2 } from "lucide-react";
import { searchProducts, formatPrice, shopifyImageUrl } from "@/lib/shopify";
import type { Product } from "@/lib/shopify";
import { cn } from "@/lib/utils";

const CATEGORY_TABS = [
  { label: "All",      value: undefined  },
  { label: "Wheels",   value: "Wheels"   },
  { label: "Parts",    value: "Parts"    },
  { label: "Services", value: "Services" },
] as const;

type CategoryValue = (typeof CATEGORY_TABS)[number]["value"];

/** Rank a product result by how closely it matches the query. Lower = better. */
function relevanceScore(product: Product, query: string): number {
  const q     = query.toLowerCase();
  const title = product.title.toLowerCase();
  const desc  = (product.description || "").toLowerCase();
  if (title === q)          return 0;
  if (title.startsWith(q))  return 1;
  if (title.includes(q))    return 2;
  if (desc.includes(q))     return 3;
  return 4;
}

export default function SearchResults() {
  const [location, navigate] = useLocation();

  // Parse query params from the URL
  const params      = new URLSearchParams(location.split("?")[1] || "");
  const initialQ    = params.get("q") || "";
  const initialType = (params.get("type") || undefined) as CategoryValue;

  const [query,     setQuery]     = useState(initialQ);
  const [inputVal,  setInputVal]  = useState(initialQ);
  const [activeTab, setActiveTab] = useState<CategoryValue>(initialType);
  const [results,   setResults]   = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Sync URL → state when the browser navigates (e.g. back/forward)
  useEffect(() => {
    const p  = new URLSearchParams(location.split("?")[1] || "");
    const q  = p.get("q") || "";
    const t  = (p.get("type") || undefined) as CategoryValue;
    setQuery(q);
    setInputVal(q);
    setActiveTab(t);
  }, [location]);

  // Push new URL when query/tab changes
  function pushUrl(q: string, type: CategoryValue) {
    const p = new URLSearchParams();
    if (q)    p.set("q",    q);
    if (type) p.set("type", type);
    navigate(`/search?${p.toString()}`, { replace: true });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputVal.trim();
    setQuery(trimmed);
    pushUrl(trimmed, activeTab);
  }

  function handleTabChange(tab: CategoryValue) {
    setActiveTab(tab);
    pushUrl(query, tab);
  }

  // Fetch when query or tab changes
  useEffect(() => {
    if (!query) {
      setResults([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchProducts(query, activeTab)
      .then((data) => {
        if (!cancelled) {
          const ranked = [...data].sort(
            (a, b) => relevanceScore(a, query) - relevanceScore(b, query)
          );
          setResults(ranked);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Search failed — please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [query, activeTab]);

  const hasResults = results.length > 0;
  const showEmpty  = query && !loading && !hasResults && !error;

  return (
    <div className="min-h-screen bg-background text-white pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Page heading */}
        <h1 className="font-tech uppercase tracking-widest text-2xl mb-8">
          Search Results
        </h1>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-3 border border-white/10 px-4 py-3 mb-0">
          <Search className="w-5 h-5 text-white/40 shrink-0" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search wheels by name or size…"
            className="flex-1 bg-transparent text-white placeholder-white/30 font-tech text-sm focus:outline-none"
            aria-label="Search products"
          />
          {loading && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
          <button
            type="submit"
            className="font-tech text-[10px] uppercase tracking-widest text-primary/70 hover:text-primary transition-colors"
          >
            Search
          </button>
        </form>

        {/* Category filter tabs */}
        <div className="flex gap-0 border-b border-white/10 mb-8">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={String(tab.value)}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "py-2 px-4 font-tech text-[10px] uppercase tracking-widest transition-colors border-b-2 -mb-px",
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-white/30 hover:text-white/60"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Result count */}
        {query && !loading && (
          <p className="font-tech text-[10px] uppercase tracking-widest text-white/30 mb-6">
            {hasResults
              ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`
              : ""}
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 font-tech text-xs text-center py-12">{error}</p>
        )}

        {/* Empty state */}
        {showEmpty && (
          <p className="text-white/30 font-tech text-xs uppercase tracking-widest text-center py-12">
            No results for &ldquo;{query}&rdquo;
          </p>
        )}

        {/* No query yet */}
        {!query && !loading && (
          <p className="text-white/20 font-tech text-xs uppercase tracking-widest text-center py-12">
            Enter a search term above
          </p>
        )}

        {/* Results grid */}
        {hasResults && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((product) => {
              const img   = product.images.edges[0]?.node;
              const price = product.priceRange.minVariantPrice;
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="group flex flex-col border border-white/10 hover:border-primary/40 transition-colors bg-white/[0.02]"
                >
                  {/* Image */}
                  <div className="aspect-square bg-white/5 overflow-hidden">
                    {img ? (
                      <img
                        src={shopifyImageUrl(img.url, 400, 400)}
                        alt={img.altText || product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <Search className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1">
                    <p className="font-tech uppercase tracking-wider text-xs text-white group-hover:text-primary transition-colors line-clamp-2">
                      {product.title}
                    </p>
                    {product.productType && (
                      <p className="text-[10px] text-white/30 font-tech uppercase tracking-widest">
                        {product.productType}
                      </p>
                    )}
                    <p className="font-tech text-xs text-primary mt-auto pt-2">
                      {formatPrice(price)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
