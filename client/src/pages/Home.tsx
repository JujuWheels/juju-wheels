import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getAllWheels, type Product } from "@/lib/shopify";
import { ProductCard } from "@/components/ui/ProductCard";
import { AuthenticityBlock } from "@/components/ui/AuthenticityBlock";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, MapPin, ShieldCheck, CheckCircle, Package, Loader2, ArrowUpDown, Wind, Paintbrush, CircleDot, Hammer, Tag } from "lucide-react";

/* ─── Custom icons ──────────────────────────────────────────────────── */
function CoiloverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* top mount */}
      <line x1="7" y1="2" x2="17" y2="2" />
      {/* damper rod */}
      <line x1="12" y1="2" x2="12" y2="5" />
      {/* spring coil — zigzag between guide rails */}
      <polyline points="12,5 8,7 16,9.5 8,12 16,14.5 12,16" />
      {/* damper body */}
      <rect x="9.5" y="16" width="5" height="5" rx="0.5" />
      {/* bottom mount */}
      <line x1="7" y1="22" x2="17" y2="22" />
    </svg>
  );
}

function SpinnerWheelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* outer rim */}
      <circle cx="12" cy="12" r="10" />
      {/* center hub cap */}
      <circle cx="12" cy="12" r="2.2" />
      {/* 4 curved blades — swept clockwise to suggest spin */}
      <path d="M13.5 9.8 C15 8 17 6.5 18.5 5.5" />
      <path d="M14.2 13.5 C16 15 17.5 17 18.5 18.5" />
      <path d="M10.5 14.2 C9 16 7.5 18 6.5 19.5" />
      <path d="M9.8 10.5 C8 9 6.5 7 5.5 5.5" />
    </svg>
  );
}
import { Link } from "wouter";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/hooks/use-auth";
import { useScrollAnimation, useStaggerChildren } from "@/hooks/use-scroll-animation";
import { TextReveal } from "@/components/ui/TextReveal";
import { SEO } from "@/components/SEO";
import { FeatureSlideshow } from "@/components/ui/FeatureSlideshow";

/* ─── Category Quick Nav ────────────────────────────────────────────── */
const QUICK_NAV = [
  { label: "Wheels for Sale",      href: "/collections/wheels-for-sale",              icon: CircleDot  }, // wheel with centre bolt
  { label: "Wheel Rebuilding",     href: "/wheel-rebuilding",                         icon: Hammer     }, // repair / rebuild
  { label: "Refinishing",          href: "/powdercoating",                            icon: Paintbrush }, // powder / paint
  { label: "StanceParts Air Cups", href: "/stanceparts",                              icon: Wind       }, // pneumatic air
  { label: "BC Racing Coilovers",  href: "/bc-racing",                                icon: CoiloverIcon     }, // coilover spring/damper
  { label: "Spinners",             href: "/products/chrome-wheel-spinners",           icon: SpinnerWheelIcon }, // spinner wheel
  { label: "Merchandise",          href: "/collections/merchandise",                  icon: Tag        }, // price / merch tag
];

function QuickNav() {
  return (
    <section aria-label="Shop by category" className="bg-black border-b border-white/10">
      {/* Section label */}
      <div className="border-b border-white/[0.06] px-6 py-3 flex items-center gap-3">
        <span className="w-3 h-px bg-primary" />
        <span className="font-tech uppercase tracking-[0.35em] text-[11px] text-white/40">Shop by Category</span>
      </div>

      {/* Tile grid — horizontal scroll on mobile, full grid on desktop */}
      <ul className="grid grid-cols-7 divide-x divide-white/[0.06] overflow-x-auto min-w-0">
        {QUICK_NAV.map(({ label, href, icon: Icon }, i) => (
          <li key={href} className="min-w-[130px]">
            <Link
              href={href}
              className="group relative flex flex-col items-center justify-center gap-4 py-10 px-4 overflow-hidden transition-colors duration-200 hover:bg-white/[0.03]"
            >
              {/* Yellow bottom-border slide-up on hover */}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

              {/* Index number — dim, top-right */}
              <span className="absolute top-3 right-3.5 font-tech text-[9px] text-white/15 group-hover:text-primary/40 transition-colors">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Icon */}
              <span className="relative flex items-center justify-center w-12 h-12 border border-white/10 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-200">
                <Icon className="w-5 h-5 text-white/40 group-hover:text-primary transition-colors duration-200" />
              </span>

              {/* Label */}
              <span className="font-tech uppercase tracking-widest text-[10px] text-white/60 group-hover:text-white transition-colors duration-200 text-center leading-tight">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ─── Slim Trust + Account Bar ─────────────────────────────────────── */
function SlimBar() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const anim = useScrollAnimation("fade-in");

  const trustItems = [
    { icon: Truck,       label: t('trust.freeShippingBanner') },
    { icon: MapPin,      label: t('trust.stockDrachten') },
    { icon: ShieldCheck, label: t('trust.authenticWheels') },
    { icon: CheckCircle, label: t('trust.expertAdvice') },
  ];

  return (
    <div ref={anim.ref} className={`border-b border-white/10 ${anim.className}`}>
      <div className="bg-white/[0.03]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-1 flex-1 py-2 min-w-0">
              {trustItems.map((item, i) => (
                <div key={i} className={`${i === 0 ? "flex" : "hidden lg:flex"} items-center gap-2 py-1 min-w-0`}>
                  <item.icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-white/60 font-tech uppercase tracking-wider text-[11px] leading-snug">{item.label}</span>
                </div>
              ))}
            </div>
            {!isLoading && !isAuthenticated && (
              <div className="hidden md:flex items-center gap-4 border-l border-white/10 pl-6 py-2.5 flex-shrink-0">
                <Link href="/login" aria-label="Sign up for a Juju Wheels account">
                  <button
                    className="bg-primary text-black px-5 py-2 font-tech uppercase text-[10px] tracking-widest hover:bg-primary/90 transition-colors whitespace-nowrap"
                    data-testid="button-banner-signup"
                  >
                    {t('banner.signUp')} <ArrowRight className="w-3 h-3 inline-block ml-1.5" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tabbed Shop Section ───────────────────────────────────────────── */
type ShopTab = "new" | "sale" | "preorder";

interface ShopSectionProps {
  featuredProducts: Product[];
  saleProducts: Product[];
  preOrderProducts: Product[];
  isLoading: boolean;
  error: Error | null;
}

type SortKey = "newest" | "price-asc" | "price-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest",     label: "Newest First" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

function ShopSection({ featuredProducts, saleProducts, preOrderProducts, isLoading, error }: ShopSectionProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>("new");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const { t } = useLanguage();
  const { ref: gridRef, isVisible: gridVisible } = useStaggerChildren();

  const tabs: { id: ShopTab; label: string; count: number }[] = [
    { id: "new",      label: t('home.latestArrivals') || 'New Arrivals', count: featuredProducts.length },
    { id: "sale",     label: t('home.onSale') || 'On Sale',              count: saleProducts.length },
    { id: "preorder", label: t('preorder.badge') || 'Pre-Order',         count: preOrderProducts.length },
  ];

  const viewAllLinks: Record<ShopTab, string> = {
    new:      "/collections/wheels-for-sale",
    sale:     "/sale",
    preorder: "/pre-order",
  };

  const idNum = (p: Product) => parseInt(p.id.split("/").pop() || "0", 10);
  const price = (p: Product) => parseFloat(p.priceRange.minVariantPrice.amount);

  const rawActive =
    activeTab === "new"      ? featuredProducts :
    activeTab === "sale"     ? saleProducts :
                               preOrderProducts;

  const activeProducts = [...rawActive].sort((a, b) => {
    if (activeTab === "new") {
      const avail = (b.availableForSale ? 1 : 0) - (a.availableForSale ? 1 : 0);
      if (avail !== 0) return avail;
    }
    if (sortBy === "newest")     return idNum(b) - idNum(a);
    if (sortBy === "price-asc")  return price(a) - price(b);
    if (sortBy === "price-desc") return price(b) - price(a);
    return 0;
  }).slice(0, 9);

  return (
    <section className="py-20 md:py-28 border-t border-white/10" data-testid="section-shop">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-primary font-tech uppercase tracking-[0.3em] text-xs mb-3 block">
              {t('home.shopSectionLabel')}
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase leading-tight" data-testid="text-shop-title">
              {t('home.shopSectionTitle')}
            </h2>
          </div>
          <Link href={viewAllLinks[activeTab]} aria-label={`View all ${tabs.find(tb => tb.id === activeTab)?.label}`}>
            <span className="hidden md:inline-flex items-center gap-2 text-primary hover:text-white transition-colors font-tech uppercase tracking-widest text-sm cursor-pointer">
              {t('general.viewAll')} <span aria-hidden="true">&rarr;</span>
            </span>
          </Link>
        </div>

        {/* Tabs + Sort row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
          <div className="flex gap-2 flex-wrap" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 font-tech uppercase tracking-widest text-xs transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-primary text-black"
                    : "border border-white/20 text-white/60 hover:border-primary/50 hover:text-white"
                }`}
                data-testid={`tab-shop-${tab.id}`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] ${activeTab === tab.id ? "text-black/60" : "text-white/30"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort pills */}
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <ArrowUpDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 text-[10px] font-tech uppercase tracking-widest border transition-colors whitespace-nowrap ${
                  sortBy === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/70"
                }`}
                data-testid={`sort-shop-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground font-tech uppercase tracking-wider" data-testid="text-error">
              {t('home.connectShopify')}
            </p>
          </div>
        ) : activeProducts.length > 0 ? (
          <div
            ref={gridRef}
            className={`grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 stagger-children${gridVisible ? " stagger-visible" : ""}`}
            role="tabpanel"
          >
            {activeProducts.slice(0, 9).map((product) => (
              <ProductCard key={product.id} product={product} className="[&_.aspect-square]:aspect-[4/5]" />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center border border-white/10">
            <Package className="w-14 h-14 text-primary/20 mx-auto mb-4" />
            <p className="text-white/40 font-tech uppercase tracking-wider text-sm" data-testid="text-no-products">
              {t('home.noProducts')}
            </p>
          </div>
        )}

        {/* Mobile view all */}
        <div className="mt-8 md:hidden">
          <Link href={viewAllLinks[activeTab]} aria-label="View all products">
            <button className="w-full border border-white/20 text-white font-tech uppercase tracking-widest py-3 hover:bg-white/5 transition-colors">
              {t('general.viewAll')}
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function Home() {
  const { t } = useLanguage();
  const partsCtaAnim = useScrollAnimation("scale-up");

  const { data: wheelProducts, isLoading: wheelsLoading, error: wheelsError } = useQuery<Product[]>({
    queryKey: ["wheels", "all-for-home"],
    queryFn: () => getAllWheels(),
  });

  const { data: allProducts, isLoading: allLoading } = useQuery<Product[]>({
    queryKey: ["products", "all-for-home"],
    queryFn: () => getProducts(250),
  });

  const isLoading = wheelsLoading || allLoading;
  const error = wheelsError as Error | null;

  const sortAvailableFirst = (products: Product[]) =>
    [...products].sort((a, b) => {
      if (a.availableForSale === b.availableForSale) return 0;
      return a.availableForSale ? -1 : 1;
    });

  const isWork = (p: Product) =>
    p.availableForSale && /\bwork\b/i.test(p.title);

  const topPicksProducts = [...(wheelProducts || [])]
    .filter((p) => p.availableForSale)
    .sort((a, b) => {
      const aWork = isWork(a) ? 0 : 1;
      const bWork = isWork(b) ? 0 : 1;
      return aWork - bWork;
    })
    .slice(0, 3);

  const shopifyIdNum = (p: Product) => parseInt(p.id.split("/").pop() || "0", 10);
  const featuredProducts = [...(wheelProducts || [])].sort((a, b) => shopifyIdNum(b) - shopifyIdNum(a));

  const saleProducts = sortAvailableFirst([...(wheelProducts || []), ...(allProducts || [])].filter((p, i, arr) => {
    if (arr.findIndex(x => x.id === p.id) !== i) return false;
    const compareAt = p.compareAtPriceRange?.minVariantPrice;
    const price = p.priceRange.minVariantPrice;
    return compareAt && parseFloat(compareAt.amount) > 0 && parseFloat(compareAt.amount) > parseFloat(price.amount);
  }));

  const preOrderProducts = sortAvailableFirst((wheelProducts || []).filter((p: Product) =>
    p.tags?.some((tag: string) => tag.toLowerCase() === "pre-order")
  ));

  return (
    <div className="space-y-0">
      <SEO
        title="Juju Wheels — Authentic JDM Wheels | Europe's Wheel Shop"
        description="Shop authentic JDM wheels from Work, BBS, SSR, Rays, Enkei & more. Lips, barrels, refinishing and fitment advice. Based in the Netherlands."
      />

      <h1 className="sr-only">Juju Wheels — Authentic JDM Wheels, Lips & Barrels</h1>

      {/* ── 1. FEATURE SLIDESHOW ── */}
      <FeatureSlideshow newArrivalImages={
        [...(wheelProducts || [])]
          .filter((p) => p.availableForSale && p.images?.edges?.[0]?.node?.url)
          .sort((a, b) => {
            const aId = parseInt(a.id.split("/").pop() || "0", 10);
            const bId = parseInt(b.id.split("/").pop() || "0", 10);
            return bId - aId;
          })
          .slice(0, 4)
          .map((p) => p.images.edges[0].node.url)
      } />

      {/* ── 2. SLIM TRUST + ACCOUNT BAR ── */}
      <SlimBar />

      {/* ── 3. CATEGORY QUICK NAV ── */}
      <QuickNav />

      <div className="bg-background">

        {/* ── 4. MOST VIEWED WHEELS ── */}
        <section className="border-t border-white/10 py-20 md:py-28" data-testid="section-most-viewed">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-primary font-tech uppercase tracking-[0.3em] text-xs mb-3 block">
                  Most Viewed
                </span>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase leading-tight">
                  Top Picks
                </h2>
              </div>
              <Link href="/collections/wheels-for-sale" aria-label="View all wheels">
                <span className="hidden md:inline-flex items-center gap-2 text-primary hover:text-white transition-colors font-tech uppercase tracking-widest text-sm cursor-pointer">
                  View All <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
            {isLoading ? (
              <div className="py-16 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                {topPicksProducts.map((product) => (
                  <ProductCard key={product.id} product={product} className="[&_.aspect-square]:aspect-[4/5]" />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 5. BC RACING PROMO — text left, image right ── */}
        <section className="border-t border-white/10 relative overflow-hidden" data-testid="section-bcracing-promo">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="py-20 md:py-28 px-6 md:px-16 relative flex flex-col justify-center">
              <div className="mb-6">
                <div className="mb-5 flex items-center">
                  <img
                    src="/bc-racing-logo.png"
                    alt="BC Racing"
                    className="h-14 md:h-20 w-auto max-w-[320px]"
                  />
                </div>
                <span className="border border-primary/40 text-primary font-tech uppercase tracking-[0.3em] text-[10px] px-3 py-1.5">
                  {t('bcracing.promoBadge') || 'Official Dealer'}
                </span>
              </div>
              <h2
                className="text-4xl md:text-5xl font-display font-bold text-white uppercase leading-tight mb-5"
                data-testid="text-bcracing-promo-title"
              >
                {t('bcracing.promoTitle') || 'Fully Adjustable,'}<br />
                <span className="text-primary">{t('bcracing.promoTitleAccent') || 'Track-Ready Coilovers'}</span>
              </h2>
              <p className="text-white/70 text-base leading-relaxed mb-5 max-w-lg">
                Spring rate, damping, ride height. Everything gets set around your car, your tyres, and how you actually drive it. BC Racing has been doing it that way since the beginning and it shows in how the kits perform out of the box.
              </p>
              <p className="text-white/50 text-base leading-relaxed mb-10 max-w-lg">
                We're the official dealer in the Netherlands. Full catalogue, custom specs on request, shipped straight to your garage or workshop. What you see is what it costs.
              </p>
              <Link href="/bc-racing" aria-label="Shop BC Racing Coilovers">
                <Button
                  size="lg"
                  className="bg-primary text-black hover:bg-white hover:text-black font-tech uppercase tracking-widest text-xs h-12 px-8 rounded-none self-start"
                  data-testid="button-bcracing-promo-shop"
                >
                  Shop BC Racing <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* image column — truly edge-to-edge */}
            <div className="hidden lg:block relative min-h-[560px]">
              <img
                src="/bc-racing/hero.jpg"
                alt="BC Racing coilovers"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/10 to-transparent" />
            </div>
          </div>
        </section>

        {/* ── 6. STANCEPARTS PROMO — image left, text right ── */}
        <section className="border-t border-white/10 relative overflow-hidden" data-testid="section-stanceparts-promo">
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* image column first — edge-to-edge on the left */}
            <div className="hidden lg:block relative min-h-[560px]">
              <img
                src="/stanceparts/sp-coilovers.png"
                alt="StanceParts coilovers"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/10 to-transparent" />
            </div>

            {/* text column on the right */}
            <div className="py-20 md:py-28 px-6 md:px-16 relative flex flex-col justify-center">
              <div className="mb-6">
                <img src="/stanceparts-logo.png" alt="StanceParts" className="h-10 md:h-14 w-auto mb-5" />
                <span className="border border-primary/40 text-primary font-tech uppercase tracking-[0.3em] text-[10px] px-3 py-1.5">
                  {t('stanceparts.promoBadge') || 'Official Retailer'}
                </span>
              </div>
              <h2
                className="text-4xl md:text-5xl font-display font-bold text-white uppercase leading-tight mb-5"
                data-testid="text-stanceparts-promo-title"
              >
                {t('stanceparts.promoTitle') || 'Stay Slammed,'}<br />
                <span className="text-primary">{t('stanceparts.promoTitleAccent') || 'Lift When You Need'}</span>
              </h2>
              <p className="text-white/60 text-base leading-relaxed mb-8 max-w-lg">
                {t('stanceparts.promoDesc') || 'The Air Cup Lift System mounts on your coilover and raises your car up to 50mm — clear any obstacle, then drop back to stance height in seconds.'}
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                {[
                  { label: t('stanceparts.promoSpecLiftLabel') || 'Lift height',  value: t('stanceparts.promoSpecLiftValue') || 'Up to 50mm' },
                  { label: t('stanceparts.promoSpecFitmentLabel') || 'Fitment',    value: t('stanceparts.promoSpecFitmentValue') || 'Universal' },
                  { label: t('stanceparts.promoSpecModsLabel') || 'Mods needed',  value: t('stanceparts.promoSpecModsValue') || 'None' },
                  { label: t('stanceparts.promoSpecShipsLabel') || 'Ships from',  value: t('stanceparts.promoSpecShipsValue') || 'Netherlands' },
                ].map((spec) => (
                  <div key={spec.label} className="border border-white/10 bg-white/[0.03] px-5 py-4 min-w-[110px]">
                    <span className="block text-[10px] font-tech uppercase tracking-[0.25em] text-white/30 mb-1">{spec.label}</span>
                    <span className="block text-sm font-display text-white uppercase">{spec.value}</span>
                  </div>
                ))}
              </div>
              <Link href="/stanceparts" aria-label="Shop StanceParts Air Cup Lift System">
                <Button
                  size="lg"
                  className="bg-primary text-black hover:bg-white hover:text-black font-tech uppercase tracking-widest text-xs h-12 px-8 rounded-none self-start"
                  data-testid="button-stanceparts-promo-shop"
                >
                  Shop StanceParts <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── 7. SHOP — tabbed New / Sale / Pre-Order ── */}
        <ShopSection
          featuredProducts={featuredProducts}
          saleProducts={saleProducts}
          preOrderProducts={preOrderProducts}
          isLoading={isLoading}
          error={error as Error | null}
        />

        {/* ── 8. PARTS CONFIGURATOR — full-width banner ── */}
        <section className="relative overflow-hidden border-t border-white/10" data-testid="section-parts-cta">
          <div
            ref={partsCtaAnim.ref}
            className={`relative min-h-[420px] md:min-h-[520px] flex items-center ${partsCtaAnim.className}`}
          >
            <div className="absolute inset-0">
              <img
                src="/images/parts/step-4.webp"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover invert opacity-10"
              />
            </div>
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `linear-gradient(rgba(233,211,85,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(233,211,85,0.4) 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
            }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/60" />

            <div className="container mx-auto px-4 relative z-10 py-20 md:py-28">
              <div className="max-w-2xl">
                <span className="text-primary font-tech uppercase tracking-[0.3em] text-xs mb-3 block">
                  {t('home.partsConfBadge')}
                </span>
                <TextReveal
                  text={t('home.lipsBarrels')}
                  className="text-4xl md:text-5xl font-display font-bold text-white mb-5 uppercase"
                />
                <p className="text-white/50 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
                  {t('home.lipsBarrelsSubtitle')}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/parts-configurator" aria-label="Open Parts Configurator" data-testid="link-home-configurator">
                    <Button size="lg" className="bg-primary text-black hover:bg-white hover:text-black font-tech uppercase tracking-widest text-xs h-12 px-8 rounded-none">
                      {t('configurator.title')} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <div className="flex gap-3 items-center flex-wrap">
                    {[
                      { href: "/parts-configurator", label: t('configurator.flatLip'),      testid: "link-home-flat-lip" },
                      { href: "/parts-configurator", label: t('configurator.stepLip'),      testid: "link-home-step-lip" },
                      { href: "/parts-configurator", label: t('configurator.innerBarrels'), testid: "link-home-inner-barrel" },
                    ].map((item) => (
                      <Link key={item.testid} href={item.href} aria-label={item.label} data-testid={item.testid}>
                        <span className="border border-white/20 text-white/60 font-tech uppercase tracking-widest text-xs px-5 py-3 hover:border-primary/50 hover:text-white transition-all cursor-pointer block">
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 9. AUTHENTICITY BLOCK — horizontal icon strip ── */}
        <AuthenticityBlock />

      </div>
    </div>
  );
}
