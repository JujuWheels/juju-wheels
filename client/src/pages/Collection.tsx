import { useQuery } from "@tanstack/react-query";
import { getCollectionByHandle, getProducts, getAllWheels, getProductByHandle, type Collection, type Product } from "@/lib/shopify";
import { useRoute, Link, useSearch } from "wouter";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/button";
import { Filter, Loader2, X, Zap, ArrowUpDown } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { useState, useMemo } from "react";
import { SEO } from "@/components/SEO";
import { useCart } from "@/hooks/use-cart";
import { formatPrice, shopifyImageUrl } from "@/lib/shopify";

const KNOWN_BRANDS = [
  "Work", "SSR", "BBS", "Rays", "Enkei", "Weds", "Advan", "Blitz",
  "Volk", "Meister", "Professor", "OZ", "OZ Racing",
  "Eclair", "Leon Hardiritt", "Elia", "Fikse", "Panasport", "Hayashi",
  "Watanabe", "Longchamp", "Speed Star", "Sprint Hart", "Mugen",
  "Desmond", "Gram Lights", "Prodrive", "Yokohama", "Weld",
  "CCW", "HRE", "Rotiform", "Fifteen52", "Cosmis", "Aodhan",
  "Stance", "Techno Phantom", "Wald", "Super Advan", "RS Watanabe",
  "Bridgestone", "Centerline", "American Racing", "Forgeline",
  "AC Schnitzer", "Alpina", "Fuchs", "Borbet", "Ronal", "ATS",
  "Lenso", "Tramont", "Riverside", "NISMO"
];

function extractBrand(title: string): string | null {
  const lower = title.toLowerCase();
  const sorted = [...KNOWN_BRANDS].sort((a, b) => b.length - a.length);
  for (const brand of sorted) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  const firstWord = title.split(/\s+/)[0];
  if (firstWord && firstWord.length >= 2 && /^[A-Z]/.test(firstWord) && !/^\d/.test(firstWord)) {
    return firstWord;
  }
  return null;
}

function extractDiameter(title: string): string | null {
  const match = title.match(/(\d{2})\s*["″x×]|(\d{2})\s*inch/i);
  if (match) {
    const d = match[1] || match[2];
    const num = parseInt(d);
    if (num >= 13 && num <= 22) return `${num}"`;
  }
  const match2 = title.match(/\b(1[3-9]|2[0-2])\s*x\s*\d/i);
  if (match2) return `${match2[1]}"`;
  return null;
}

function extractWidth(title: string): string | null {
  const match = title.match(/(\d+(?:\.\d+)?)\s*J\b/i);
  if (match) return `${match[1]}J`;
  const match2 = title.match(/x\s*(\d+(?:\.\d+)?)\s*J?\b/i);
  if (match2) {
    const w = parseFloat(match2[1]);
    if (w >= 4 && w <= 15) return `${match2[1]}J`;
  }
  return null;
}

function extractPCD(title: string, description?: string): string | null {
  const text = `${title} ${description || ""}`;
  const match = text.match(/\b([3-8])\s*[xX×]\s*(\d{2,3}(?:\.\d+)?)\b/);
  if (match) {
    const bolts = parseInt(match[1]);
    const circle = parseFloat(match[2]);
    if (bolts >= 3 && bolts <= 8 && circle >= 80 && circle <= 160) {
      return `${bolts}x${circle % 1 === 0 ? circle.toFixed(0) : circle}`;
    }
  }
  return null;
}

function getSpinnerVariantForInch(inch: number | null): string | null {
  if (!inch) return null;
  if (inch <= 16) return "15/16";
  if (inch <= 18) return "17/18";
  if (inch === 19) return "19";
  return "21";
}

function extractInchFromHandle(handle: string): number | null {
  const m = handle.match(/(\d+)-inch/);
  if (m) return parseInt(m[1]);
  return null;
}

function extractInchFromTitle(title: string): number | null {
  const m = title.match(/(\d+)\s*(?:inch|")/i);
  if (m) {
    const n = parseInt(m[1]);
    if (n >= 13 && n <= 24) return n;
  }
  return null;
}

function SpinnerBanner({ inch }: { inch: number | null }) {
  const { addItem, isUpdating } = useCart();
  const { data: spinner } = useQuery<Product | null>({
    queryKey: ["product", "chrome-wheel-spinners"],
    queryFn: () => getProductByHandle("chrome-wheel-spinners"),
    staleTime: 5 * 60 * 1000,
  });

  if (!spinner) return null;

  const targetVariantTitle = getSpinnerVariantForInch(inch);
  const variants = spinner.variants.edges.map((e: any) => e.node);
  const matchedVariant = targetVariantTitle
    ? variants.find((v: any) => v.title === targetVariantTitle) || variants[0]
    : variants[0];

  if (!matchedVariant) return null;

  const image = spinner.images.edges[0]?.node?.url;
  const price = matchedVariant.price || spinner.priceRange.minVariantPrice;

  return (
    <div className="mb-10 relative border border-primary/30 bg-black overflow-hidden" data-testid="banner-spinners">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-0">
        {image && (
          <div className="w-full sm:w-48 h-48 flex-shrink-0 overflow-hidden bg-white/5">
            <img
              src={shopifyImageUrl(image, 400)}
              alt={spinner.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-tech uppercase tracking-[0.3em] text-primary">Style add-on</span>
            </div>
            <h3 className="text-white font-display uppercase text-lg mb-1">{spinner.title}</h3>
            {targetVariantTitle && (
              <p className="text-white/50 text-xs font-tech uppercase tracking-wider mb-2">
                Size: <span className="text-primary">{targetVariantTitle}"</span> — fits {inch ? `${inch}"` : "your"} wheels
              </p>
            )}
            <span className="text-primary font-tech text-xl">{formatPrice(price)}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link href={`/products/${spinner.handle}`} aria-label={`View details for ${spinner.title || 'spinner'}`}>
              <button className="px-5 py-2.5 border border-white/20 text-white text-xs font-tech uppercase tracking-widest hover:border-white/50 transition-colors whitespace-nowrap"
                      data-testid="button-spinner-view">
                View Details
              </button>
            </Link>
            <button
              onClick={() => addItem(matchedVariant.id, 1)}
              disabled={isUpdating || !matchedVariant.availableForSale}
              className="px-5 py-2.5 bg-primary text-black text-xs font-tech uppercase tracking-widest font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
              data-testid="button-spinner-add"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const [, params] = useRoute("/collections/:handle");
  const handle = params?.handle || "";
  const isAllProducts = handle === "all";
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const pcdFilter = searchParams.get("pcd");
  const { t } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedDiameters, setSelectedDiameters] = useState<string[]>([]);
  const [selectedWidths, setSelectedWidths] = useState<string[]>([]);
  const [selectedPCDs, setSelectedPCDs] = useState<string[]>([]);
  type SortKey = "default" | "price-asc" | "price-desc" | "newest";
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "default",    label: "Default" },
    { value: "price-asc",  label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "newest",     label: "Newest First" },
  ];

  const isWheelHandle = handle.includes("inch") || handle === "wheels-for-sale";

  const { data: collection, isLoading: collLoading, error: collError } = useQuery<Collection | null>({
    queryKey: ["collection", handle],
    queryFn: () => getCollectionByHandle(handle),
    enabled: !!handle && !isAllProducts,
  });

  // For "all products" page: use getProducts
  const { data: allProducts, isLoading: allLoading, error: allError } = useQuery<Product[]>({
    queryKey: ["products", "all"],
    queryFn: () => getProducts(250),
    enabled: isAllProducts,
  });

  // For wheel collection pages: fetch from every inch collection so nothing is missed
  const { data: allWheelProducts, isLoading: allWheelsLoading } = useQuery<Product[]>({
    queryKey: ["all-wheels"],
    queryFn: () => getAllWheels(),
    enabled: isWheelHandle,
  });

  const isLoading = isAllProducts
    ? allLoading
    : isWheelHandle
    ? (collLoading || allWheelsLoading)
    : collLoading;
  const error = isAllProducts ? allError : collError;

  const pcdLabel = pcdFilter ? pcdFilter.replace("x", "×") : "";
  const baseTitle = isAllProducts ? t('collection.allProducts') : (collection?.title || "");
  const title = pcdFilter ? `${baseTitle} — ${pcdLabel} PCD` : baseTitle;
  const rawDescription = pcdFilter
    ? t('collection.showingPCD').replace('{pcd}', pcdLabel)
    : isAllProducts ? t('collection.browseAll') : (collection?.description || "");
  const description = rawDescription
    ? rawDescription.replace(/[^\x20-\x7E\u00A0-\u024F\u0400-\u04FF\u00C0-\u017F]/g, "").replace(/\s+/g, " ").trim().slice(0, 200) + (rawDescription.length > 200 ? "…" : "")
    : "";

  const collectionProducts = collection?.products?.edges?.map((e) => e.node) || [];

  const isWheelsCollection = handle.includes("wheel") || handle.includes("inch") || isAllProducts || handle === "wheels-for-sale";
  const isStepUpKits = handle === "step-up-wheel-kits";
  const isServices = handle === "services";
  // Resolve inch from title (authoritative) then fall back to handle number
  const collectionInch = extractInchFromTitle(collection?.title || "") ?? extractInchFromHandle(handle);
  const isAllWheelsPage = handle === "wheels-for-sale";

  const rawProducts = useMemo(() => {
    if (isAllProducts) return allProducts || [];
    if (isWheelHandle) {
      if (isAllWheelsPage) {
        // "wheels-for-sale" — merge everything: all inch collections + anything in the
        // Shopify collection that isn't already in the pool, deduped by ID.
        const wheelList = allWheelProducts || [];
        const wheelIds = new Set(wheelList.map((p) => p.id));
        const extras = collectionProducts.filter((p) => !wheelIds.has(p.id));
        return [...wheelList, ...extras];
      } else {
        // Inch-specific page — start from the Shopify collection (already size-filtered),
        // then add any extra wheels from the global pool that match this inch size exactly.
        const collIds = new Set(collectionProducts.map((p) => p.id));
        const sizeExtras = (allWheelProducts || []).filter((p) => {
          if (collIds.has(p.id)) return false;
          if (collectionInch === null) return false;
          // Match inch in product title, e.g. "18 inch", "18\"", "18INCH"
          return new RegExp(`\\b${collectionInch}\\s*(?:inch|")`, "i").test(p.title);
        });
        return [...collectionProducts, ...sizeExtras];
      }
    }
    return collectionProducts;
  }, [isAllProducts, isWheelHandle, isAllWheelsPage, collectionInch, collectionProducts, allWheelProducts, allProducts]);

  const pcdFiltered = pcdFilter
    ? rawProducts.filter((p) => {
        const text = `${p.title} ${p.description || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
        const pcd = pcdFilter.toLowerCase();
        const pcdDot = pcd.replace("x", "×");
        return text.includes(pcd) || text.includes(pcdDot) || text.includes(pcd.replace("x", " x "));
      })
    : rawProducts;
  const showSpinnerBanner = collectionInch !== null && isWheelsCollection;

  const filterOptions = useMemo(() => {
    if (!isWheelsCollection) return { brands: [], diameters: [], widths: [], pcds: [] };
    const brands = new Set<string>();
    const diameters = new Set<string>();
    const widths = new Set<string>();
    const pcds = new Set<string>();
    for (const p of pcdFiltered) {
      const brand = extractBrand(p.title);
      if (brand) brands.add(brand);
      const diam = extractDiameter(p.title);
      if (diam) diameters.add(diam);
      const width = extractWidth(p.title);
      if (width) widths.add(width);
      const pcd = extractPCD(p.title, p.description);
      if (pcd) pcds.add(pcd);
    }
    const sortNum = (a: string, b: string) => parseFloat(a) - parseFloat(b);
    const sortPCD = (a: string, b: string) => {
      const [ab, ac] = a.split("x").map(Number);
      const [bb, bc] = b.split("x").map(Number);
      return ab !== bb ? ab - bb : ac - bc;
    };
    return {
      brands: Array.from(brands).sort(),
      diameters: Array.from(diameters).sort(sortNum),
      widths: Array.from(widths).sort(sortNum),
      pcds: Array.from(pcds).sort(sortPCD),
    };
  }, [pcdFiltered, isWheelsCollection]);

  const hasFilters = filterOptions.brands.length > 1 || filterOptions.diameters.length > 1 || filterOptions.widths.length > 1 || filterOptions.pcds.length > 1;
  const activeFilterCount = selectedBrands.length + selectedDiameters.length + selectedWidths.length + selectedPCDs.length;

  const products = useMemo(() => {
    const filtered = activeFilterCount === 0 ? pcdFiltered : pcdFiltered.filter((p) => {
      if (selectedBrands.length > 0) {
        const brand = extractBrand(p.title);
        if (!brand || !selectedBrands.includes(brand)) return false;
      }
      if (selectedDiameters.length > 0) {
        const d = extractDiameter(p.title);
        if (!d || !selectedDiameters.includes(d)) return false;
      }
      if (selectedWidths.length > 0) {
        const w = extractWidth(p.title);
        if (!w || !selectedWidths.includes(w)) return false;
      }
      if (selectedPCDs.length > 0) {
        const pcd = extractPCD(p.title, p.description);
        if (!pcd || !selectedPCDs.includes(pcd)) return false;
      }
      return true;
    });

    const shopifyIdNum = (p: Product) => parseInt(p.id.split("/").pop() || "0", 10);
    const price = (p: Product) => parseFloat(p.priceRange.minVariantPrice.amount);

    return [...filtered].sort((a, b) => {
      // Always keep in-stock items before sold-out on default
      if (sortBy === "default") {
        if (a.availableForSale !== b.availableForSale)
          return a.availableForSale ? -1 : 1;
        return 0;
      }
      if (sortBy === "price-asc")  return price(a) - price(b);
      if (sortBy === "price-desc") return price(b) - price(a);
      if (sortBy === "newest")     return shopifyIdNum(b) - shopifyIdNum(a);
      return 0;
    });
  }, [pcdFiltered, selectedBrands, selectedDiameters, selectedWidths, activeFilterCount, sortBy]);

  const toggleFilter = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedDiameters([]);
    setSelectedWidths([]);
    setSelectedPCDs([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAllProducts && (error || !collection)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 gap-4">
        <p className="text-white font-display text-2xl uppercase" data-testid="text-collection-error">{t('collection.notFound')}</p>
        <p className="text-muted-foreground text-sm">
          {error ? t('collection.couldNotLoad') : t('collection.doesNotExist')}
        </p>
      </div>
    );
  }

  const FilterPanel = () => (
    <div className="space-y-6">
      {filterOptions.brands.length > 1 && (
        <div>
          <h4 className="text-primary font-tech uppercase tracking-widest text-xs font-bold mb-3">{t('collection.filterBrand')}</h4>
          <div className="flex flex-wrap gap-2">
            {filterOptions.brands.map((brand) => (
              <button
                key={brand}
                onClick={() => toggleFilter(selectedBrands, setSelectedBrands, brand)}
                className={`px-3 py-1.5 text-xs font-tech uppercase tracking-wider border transition-colors ${
                  selectedBrands.includes(brand)
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
                data-testid={`filter-brand-${brand.toLowerCase()}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}
      {filterOptions.diameters.length > 1 && (
        <div>
          <h4 className="text-primary font-tech uppercase tracking-widest text-xs font-bold mb-3">{t('collection.filterDiameter')}</h4>
          <div className="flex flex-wrap gap-2">
            {filterOptions.diameters.map((d) => (
              <button
                key={d}
                onClick={() => toggleFilter(selectedDiameters, setSelectedDiameters, d)}
                className={`px-3 py-1.5 text-xs font-tech uppercase tracking-wider border transition-colors ${
                  selectedDiameters.includes(d)
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
                data-testid={`filter-diameter-${d}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
      {filterOptions.widths.length > 1 && (
        <div>
          <h4 className="text-primary font-tech uppercase tracking-widest text-xs font-bold mb-3">{t('collection.filterWidth')}</h4>
          <div className="flex flex-wrap gap-2">
            {filterOptions.widths.map((w) => (
              <button
                key={w}
                onClick={() => toggleFilter(selectedWidths, setSelectedWidths, w)}
                className={`px-3 py-1.5 text-xs font-tech uppercase tracking-wider border transition-colors ${
                  selectedWidths.includes(w)
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
                data-testid={`filter-width-${w}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
      {filterOptions.pcds.length > 1 && (
        <div>
          <h4 className="text-primary font-tech uppercase tracking-widest text-xs font-bold mb-3">{t('collection.filterPCD')}</h4>
          <div className="flex flex-wrap gap-2">
            {filterOptions.pcds.map((pcd) => (
              <button
                key={pcd}
                onClick={() => toggleFilter(selectedPCDs, setSelectedPCDs, pcd)}
                className={`px-3 py-1.5 text-xs font-tech uppercase tracking-wider border transition-colors ${
                  selectedPCDs.includes(pcd)
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
                data-testid={`filter-pcd-${pcd}`}
              >
                {pcd}
              </button>
            ))}
          </div>
        </div>
      )}
      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="text-xs font-tech uppercase tracking-wider text-white/40 hover:text-primary transition-colors flex items-center gap-1"
          data-testid="button-clear-filters"
        >
          <X className="w-3 h-3" /> {t('collection.clearFilters')}
        </button>
      )}
    </div>
  );

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <SEO
        title={`${title} | Juju Wheels`}
        description={description || `Shop ${title} — authentic JDM wheels from Juju Wheels, Europe's premium wheel shop.`}
      />
      <div className="container mx-auto px-4">
        <div className="mb-12 border-b border-white/10 pb-8">
           <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 uppercase" data-testid="text-collection-title">{title}</h1>
           {description && <p className="text-muted-foreground max-w-2xl" data-testid="text-collection-desc">{description}</p>}
        </div>

        {isServices && (
          <div className="mb-12 space-y-8">
            <div className="p-8 border border-primary/20 bg-primary/5">
              <h2 className="text-3xl font-display text-white mb-6 uppercase">{t('ceramic.title')}</h2>
              <p className="text-muted-foreground mb-8 max-w-3xl">
                {t('ceramic.desc')}
              </p>

              <h3 className="text-xl font-display text-primary mb-4 uppercase">{t('ceramic.quickSteps')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-4 border border-white/10 bg-black/30">
                  <span className="text-primary font-display text-lg">1.</span>
                  <h4 className="text-white font-display uppercase text-sm mt-1 mb-1">{t('ceramic.step1Title')}</h4>
                  <p className="text-muted-foreground text-xs">{t('ceramic.step1Desc')}</p>
                </div>
                <div className="p-4 border border-white/10 bg-black/30">
                  <span className="text-primary font-display text-lg">2.</span>
                  <h4 className="text-white font-display uppercase text-sm mt-1 mb-1">{t('ceramic.step2Title')}</h4>
                  <p className="text-muted-foreground text-xs">{t('ceramic.step2Desc')}</p>
                </div>
                <div className="p-4 border border-white/10 bg-black/30">
                  <span className="text-primary font-display text-lg">3.</span>
                  <h4 className="text-white font-display uppercase text-sm mt-1 mb-1">{t('ceramic.step3Title')}</h4>
                  <p className="text-muted-foreground text-xs">{t('ceramic.step3Desc')}</p>
                </div>
                <div className="p-4 border border-white/10 bg-black/30">
                  <span className="text-primary font-display text-lg">4.</span>
                  <h4 className="text-white font-display uppercase text-sm mt-1 mb-1">{t('ceramic.step4Title')}</h4>
                  <p className="text-muted-foreground text-xs">{t('ceramic.step4Desc')}</p>
                </div>
              </div>

              <h3 className="text-xl font-display text-primary mb-4 uppercase">{t('ceramic.detailedProcess')}</h3>
              <div className="space-y-6 text-muted-foreground text-sm max-w-3xl mb-8">
                <div>
                  <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('ceramic.detail1Title')}</h4>
                  <p>{t('ceramic.detail1Desc')}</p>
                </div>
                <div>
                  <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('ceramic.detail2Title')}</h4>
                  <p>{t('ceramic.detail2Desc')}</p>
                </div>
                <div>
                  <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('ceramic.detail3Title')}</h4>
                  <p>{t('ceramic.detail3Desc')}</p>
                </div>
                <div>
                  <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('ceramic.detail4Title')}</h4>
                  <p>{t('ceramic.detail4Desc')}</p>
                </div>
                <div>
                  <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('ceramic.detail5Title')}</h4>
                  <p>{t('ceramic.detail5Desc')}</p>
                </div>
                <div>
                  <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('ceramic.detail6Title')}</h4>
                  <p>{t('ceramic.detail6Desc')}</p>
                </div>
                <div>
                  <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('ceramic.detail7Title')}</h4>
                  <p>{t('ceramic.detail7Desc')}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://wa.me/31611601627?text=I%20want%20to%20use%20the%20Ceramic%20Polishing%20Service!"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-primary text-primary-foreground hover:bg-white hover:text-black font-tech uppercase tracking-widest px-8 rounded-none h-12">
                    {t('ceramic.getQuoteWhatsApp')}
                  </Button>
                </a>
                <a
                  href="mailto:info@jujuwheels.com"
                  className="inline-flex items-center justify-center px-8 h-12 border border-white/20 text-white font-tech uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  {t('ceramic.emailUs')}
                </a>
              </div>
            </div>
          </div>
        )}

        {isStepUpKits && (
          <div className="mb-12 p-8 border border-primary/20 bg-primary/5 relative overflow-hidden group">
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-2xl font-display text-white mb-4 uppercase">{t('stepUp.title')}</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  {t('stepUp.desc1')}
                </p>
                <p>
                  {t('stepUp.desc2')}
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/pages/custom-requests" aria-label="Get a custom quote for step-up wheel kits">
                  <Button className="bg-primary text-primary-foreground hover:bg-white hover:text-black font-tech uppercase tracking-widest px-8 rounded-none h-12">
                    {t('stepUp.getCustomQuote')}
                  </Button>
                </Link>
                <a 
                  href="https://wa.me/31611601627" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 h-12 border border-white/20 text-white font-tech uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  {t('stepUp.messageWhatsApp')}
                </a>
              </div>
            </div>
          </div>
        )}

        {(hasFilters || true) && isWheelsCollection && (
          <>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {hasFilters && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-tech uppercase tracking-widest border transition-colors ${
                    showFilters || activeFilterCount > 0
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/20 text-white/60 hover:border-white/30"
                  }`}
                  data-testid="button-toggle-filters"
                >
                  <Filter className="w-3.5 h-3.5" />
                  {t('collection.filters')}
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-black px-1.5 py-0.5 text-[10px] font-bold ml-1">{activeFilterCount}</span>
                  )}
                </button>
              )}

              {/* Sort control */}
              <div className="relative flex items-center gap-2 ml-auto">
                <ArrowUpDown className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                <div className="flex gap-1 flex-wrap">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`px-3 py-2 text-[10px] font-tech uppercase tracking-widest border transition-colors whitespace-nowrap ${
                        sortBy === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/70"
                      }`}
                      data-testid={`sort-${opt.value}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="mb-8 p-6 border border-white/10 bg-white/[0.02] animate-in fade-in slide-in-from-top-2 duration-200">
                <FilterPanel />
              </div>
            )}

            {!showFilters && activeFilterCount > 0 && (
              <div className="mb-6 flex flex-wrap gap-2 items-center">
                {selectedBrands.map(b => (
                  <span key={b} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-tech text-primary border border-primary/30 bg-primary/10">
                    {b}
                    <button onClick={() => toggleFilter(selectedBrands, setSelectedBrands, b)} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {selectedDiameters.map(d => (
                  <span key={d} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-tech text-primary border border-primary/30 bg-primary/10">
                    {d}
                    <button onClick={() => toggleFilter(selectedDiameters, setSelectedDiameters, d)} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {selectedWidths.map(w => (
                  <span key={w} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-tech text-primary border border-primary/30 bg-primary/10">
                    {w}
                    <button onClick={() => toggleFilter(selectedWidths, setSelectedWidths, w)} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <button onClick={clearFilters} className="text-xs text-white/40 hover:text-primary ml-2" data-testid="button-clear-all">
                  {t('collection.clearAll')}
                </button>
              </div>
            )}
          </>
        )}

        {showSpinnerBanner && <SpinnerBanner inch={collectionInch} />}

        {products.length > 0 ? (
          <div className="flex-grow">
            <p className="text-white/40 text-xs font-tech uppercase tracking-wider mb-6" data-testid="text-product-count">
              {products.length} {products.length === 1 ? t('collection.product') : t('collection.products')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : activeFilterCount > 0 ? (
          <div className="py-16 text-center">
            <p className="text-white/60 font-tech uppercase tracking-wider text-sm mb-4" data-testid="text-no-filter-results">{t('collection.noFilterResults')}</p>
            <button onClick={clearFilters} className="text-primary font-tech uppercase tracking-wider text-xs hover:text-white transition-colors" data-testid="button-clear-filters-empty">
              {t('collection.clearFilters')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
