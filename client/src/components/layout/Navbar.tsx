import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, Calculator, User, LogIn, ChevronDown, ChevronRight, Car, ShieldCheck, BookOpen, ShoppingBag, Loader2, Search } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/language";
import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { lazy, Suspense } from "react";
import { SearchModal } from "./SearchModal";

const CartDrawerContent = lazy(() =>
  import("@/components/cart/CartDrawer").then((m) => ({ default: m.CartDrawerContent }))
);

/* ─── Nav data ──────────────────────────────────────────────────────── */
type NavItem = { title: string; href: string };
type NavSection = { label?: string; items: NavItem[] };
type NavEntry = {
  id: string;
  title: string;
  href?: string;
  sections?: NavSection[];
  cta?: { label: string; href: string };
};

function getNavData(t: (k: string) => string, isAuthenticated: boolean): NavEntry[] {
  const toolsItems: NavItem[] = [
    { title: t("nav.fitmentCalculator"),        href: "/fitment-calculator" },
    { title: t("nav.threePieceSpecCalculator"),  href: "/wheel-spec-calculator" },
    { title: t("nav.vehicleFitment"),            href: "/vehicle-fitment" },
  ];
  if (isAuthenticated) toolsItems.push({ title: t("garage.myGarage") || "My Garage", href: "/my-garage" });

  return [
    {
      id: "wheels",
      title: t("nav.wheels"),
      sections: [
        {
          items: [
            { title: t("nav.allWheels"), href: "/collections/wheels-for-sale" },
            { title: "Spinners",         href: "/products/chrome-wheel-spinners" },
            { title: t("nav.sale"),      href: "/sale" },
            { title: t("nav.preOrder"),  href: "/pre-order" },
          ],
        },
        {
          label: t("nav.bySize"),
          items: [
            { title: '15"', href: "/collections/15-inch-wheels" },
            { title: '16"', href: "/collections/15-inch-wheels-copy" },
            { title: '17"', href: "/collections/16-inch-wheels-copy" },
            { title: '18"', href: "/collections/17-inch-wheels-copy" },
            { title: '19"', href: "/collections/18-inch-wheels-copy" },
            { title: '20"', href: "/collections/19-inch-wheels-copy" },
          ],
        },
        {
          label: t("nav.byPCD"),
          items: [
            { title: "4×100",   href: "/collections/wheels-for-sale?pcd=4x100" },
            { title: "4×114.3", href: "/collections/wheels-for-sale?pcd=4x114.3" },
            { title: "5×100",   href: "/collections/wheels-for-sale?pcd=5x100" },
            { title: "5×114.3", href: "/collections/wheels-for-sale?pcd=5x114.3" },
            { title: "5×120",   href: "/collections/wheels-for-sale?pcd=5x120" },
            { title: "5×112",   href: "/collections/wheels-for-sale?pcd=5x112" },
          ],
        },
      ],
    },
    {
      id: "parts",
      title: t("nav.partsServices"),
      href: "/parts",
      sections: [
        {
          label: t("nav.lipsBarrels"),
          items: [
            { title: t("configurator.title") || "Parts Configurator", href: "/parts-configurator" },
            { title: t("nav.outerLips"),    href: "/collections/outer-wheel-lips" },
            { title: t("nav.innerBarrels"), href: "/collections/inner-barrels" },
            { title: t("nav.stepUpKits"),   href: "/collections/step-up-wheel-kits" },
            { title: t("nav.assemblyHardware"), href: "/products/wheel-assembly-hardware" },
          ],
        },
        {
          label: t("nav.services"),
          items: [
            { title: t("nav.spacersAdapters"),       href: "/products/custom-made-wheel-spacers-adapters" },
            { title: t("nav.powdercoating"),          href: "/powdercoating" },
            { title: t("nav.wheelRebuildingService"), href: "/wheel-rebuilding" },
            { title: t("nav.ceramicPolishing"),       href: "/collections/services" },
          ],
        },
      ],
    },
    {
      id: "stanceparts",
      title: "StanceParts",
      href: "/stanceparts",
    },
    {
      id: "bcracing",
      title: "BC Racing",
      href: "/bc-racing",
      cta: { label: "Find Your Kit", href: "/bc-racing" },
    },
    {
      id: "spinners",
      title: "Spinners",
      href: "/products/chrome-wheel-spinners",
    },
    {
      id: "tools",
      title: t("nav.tools"),
      sections: [{ items: toolsItems }],
    },
    {
      id: "about",
      title: t("nav.about"),
      sections: [
        {
          items: [
            { title: t("nav.authenticity"),   href: "/authenticity" },
            { title: t("nav.knowledge"),      href: "/knowledge" },
            { title: t("nav.customRequests"), href: "/pages/custom-requests" },
          ],
        },
      ],
    },
  ];
}

const LANGS = ["en", "nl", "de", "es", "fr"] as const;
const LANG_LABELS: Record<string, string> = { en: "EN", nl: "NL", de: "DE", es: "ES", fr: "FR" };

/* ─── Cart icon button (inline, opens Sheet) ────────────────────────── */
function NavCartButton() {
  const { cart, isLoading } = useCart();
  const totalQuantity = cart?.totalQuantity || 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label="Shopping cart"
          className="relative flex items-center justify-center w-9 h-9 text-white/70 hover:text-primary transition-colors"
          data-testid="button-nav-cart"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ShoppingBag className="w-5 h-5" />
          )}
          {totalQuantity > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-primary text-black text-[10px] font-bold flex items-center justify-center px-0.5"
              data-testid="text-nav-cart-count"
            >
              {totalQuantity}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[420px] bg-background border-l border-white/10 flex flex-col p-0">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          }
        >
          <CartDrawerContent />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Main Navbar ───────────────────────────────────────────────────── */
export function Navbar() {
  const [isScrolled, setIsScrolled]           = useState(false);
  const [mobileOpen, setMobileOpen]           = useState(false);
  const [expandedMobile, setExpandedMobile]   = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown]   = useState<string | null>(null);
  const [langOpen, setLangOpen]               = useState(false);
  const [searchOpen, setSearchOpen]           = useState(false);
  const [location]                            = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, lang, setLang }                  = useLanguage();

  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const langRef         = useRef<HTMLDivElement>(null);

  const openSearch  = useCallback(() => setSearchOpen(true),  []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const navData = getNavData(t, isAuthenticated);

  /* CMD+K / CTRL+K opens search — never toggles; ESC closes */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => prev || true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setExpandedMobile(null);
    setActiveDropdown(null);
  }, [location]);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const enterDropdown = (id: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(id);
  };
  const leaveDropdown = () => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  const isEntryActive = (entry: NavEntry): boolean => {
    if (entry.href && (location === entry.href || location.startsWith(entry.href + "/"))) return true;
    return entry.sections?.some((s) => s.items.some((i) => location === i.href)) ?? false;
  };

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 z-50 transition-all duration-300 border-b border-white/5",
          isScrolled || location !== "/" ? "bg-background/95 backdrop-blur-md" : "bg-transparent"
        )}
        style={{ top: "var(--promo-h, 0px)" }}
      >
        <div className="container mx-auto px-4 flex items-center h-16 gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="shrink-0" aria-label="Juju Wheels — Home">
            <img src="/images/logo.webp" alt="JUJU WHEELS" className="h-10 w-auto" width={100} height={50} />
          </Link>

          {/* ── Desktop nav links ── */}
          <nav className="hidden lg:flex items-center gap-0 flex-1 ml-4" aria-label="Main navigation">
            {navData.map((entry) => {
              const active = isEntryActive(entry);
              return (
                <div
                  key={entry.id}
                  className="relative"
                  onMouseEnter={() => entry.sections && enterDropdown(entry.id)}
                  onMouseLeave={leaveDropdown}
                >
                  {entry.href ? (
                    <Link
                      href={entry.href}
                      className={cn(
                        "relative px-3.5 py-2 font-tech uppercase tracking-widest text-xs transition-colors block",
                        active
                          ? "text-primary after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-primary"
                          : "text-white/60 hover:text-white"
                      )}
                      data-testid={`link-nav-${entry.id}`}
                    >
                      {entry.title}
                    </Link>
                  ) : (
                    <button
                      className={cn(
                        "relative px-3.5 py-2 font-tech uppercase tracking-widest text-xs transition-colors flex items-center gap-1",
                        active
                          ? "text-primary after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-primary"
                          : "text-white/60 hover:text-white",
                        activeDropdown === entry.id && !active && "text-white"
                      )}
                      data-testid={`button-nav-${entry.id}`}
                    >
                      {entry.title}
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 transition-transform duration-200",
                          activeDropdown === entry.id && "rotate-180"
                        )}
                      />
                    </button>
                  )}

                  {/* Desktop dropdown */}
                  {entry.sections && activeDropdown === entry.id && (
                    <div
                      className="absolute top-full left-0 pt-1 z-50"
                      onMouseEnter={() => enterDropdown(entry.id)}
                      onMouseLeave={leaveDropdown}
                    >
                      <div className="bg-background/98 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[200px] p-4 animate-in fade-in slide-in-from-top-1 duration-150">
                        {entry.sections.map((section, si) => (
                          <div key={si} className={cn(si > 0 && "mt-4 pt-4 border-t border-white/10")}>
                            {section.label && (
                              <div className="text-[10px] font-tech uppercase tracking-widest text-white/30 mb-2 px-2">
                                {section.label}
                              </div>
                            )}
                            <ul className="space-y-0.5">
                              {section.items.map((item) => (
                                <li key={item.href}>
                                  <Link
                                    href={item.href}
                                    className={cn(
                                      "block px-2 py-1.5 font-tech uppercase tracking-wider text-xs transition-colors whitespace-nowrap",
                                      location === item.href
                                        ? "text-primary"
                                        : "text-white/60 hover:text-primary"
                                    )}
                                  >
                                    {item.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ── Right icons ── */}
          <div className="flex items-center gap-2 ml-auto lg:ml-0">

            {/* Search */}
            <button
              onClick={openSearch}
              aria-label="Search (⌘K)"
              className="flex items-center justify-center w-9 h-9 text-white/60 hover:text-primary transition-colors"
              data-testid="button-nav-search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Language switcher — compact `EN ▾` */}
            <div ref={langRef} className="relative hidden sm:block">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 text-white/50 hover:text-white font-tech uppercase tracking-widest text-xs transition-colors px-2 py-2"
                data-testid="button-lang-switcher"
                aria-label={`Language: ${LANG_LABELS[lang]}`}
              >
                {LANG_LABELS[lang]}
                <ChevronDown
                  className={cn("w-3 h-3 transition-transform duration-150", langOpen && "rotate-180")}
                />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-0.5 bg-background/98 backdrop-blur-xl border border-white/10 shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150 min-w-[64px]">
                  {LANGS.map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 font-tech uppercase tracking-widest text-xs transition-colors",
                        lang === l ? "text-primary" : "text-white/50 hover:text-white"
                      )}
                      data-testid={`button-lang-${l}`}
                    >
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account icon */}
            {!authLoading && (
              isAuthenticated ? (
                <Link
                  href="/my-account"
                  className="text-white/60 hover:text-primary transition-colors"
                  aria-label="My Account"
                  data-testid="link-my-account"
                >
                  {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="" className="w-7 h-7 rounded-full border border-white/20" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </Link>
              ) : (
                <a
                  href="/login"
                  aria-label="Log in"
                  className="hidden sm:flex text-white/60 hover:text-primary transition-colors"
                  data-testid="link-login"
                >
                  <LogIn className="w-5 h-5" />
                </a>
              )
            )}

            {/* Cart — inline Sheet trigger */}
            <NavCartButton />

            {/* Mobile hamburger */}
            <button
              onClick={() => { setMobileOpen(!mobileOpen); setExpandedMobile(null); }}
              className={cn(
                "lg:hidden flex items-center justify-center w-9 h-9 transition-colors border",
                mobileOpen
                  ? "bg-primary text-black border-primary"
                  : "text-white/60 border-white/20 hover:border-primary/60 hover:text-primary"
              )}
              data-testid="button-menu-toggle"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background flex flex-col lg:hidden"
          data-testid="nav-mobile-overlay"
        >
          <div className="h-16 shrink-0" />
          <div className="flex-1 overflow-y-auto">
            <nav className="px-6 py-2" aria-label="Mobile navigation">
              {navData.map((entry) => {
                const active = isEntryActive(entry);
                return (
                  <div key={entry.id} className="border-b border-white/8">
                    {entry.href && !entry.sections ? (
                      <>
                      <Link
                        href={entry.href}
                        className={cn(
                          "flex items-center justify-between w-full py-5 text-left",
                          active ? "text-primary" : "text-white hover:text-primary"
                        )}
                        data-testid={`link-nav-mobile-${entry.id}`}
                      >
                        <span className="text-2xl md:text-3xl font-display uppercase tracking-wide">
                          {entry.title}
                        </span>
                        <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
                      </Link>
                      {entry.cta && (
                        <div className="pb-4">
                          <Link
                            href={entry.cta.href}
                            className="inline-flex items-center gap-2 bg-primary text-black font-tech uppercase tracking-widest text-xs px-6 py-3 hover:bg-white transition-colors"
                            data-testid={`link-nav-mobile-cta-${entry.id}`}
                          >
                            {entry.cta.label} <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setExpandedMobile(expandedMobile === entry.id ? null : entry.id)}
                          className={cn(
                            "flex items-center justify-between w-full py-5 text-left transition-colors",
                            active ? "text-primary" : "text-white"
                          )}
                          data-testid={`button-nav-mobile-${entry.id}`}
                          aria-expanded={expandedMobile === entry.id}
                        >
                          <span className="text-2xl md:text-3xl font-display uppercase tracking-wide">
                            {entry.title}
                          </span>
                          <ChevronDown
                            className={cn(
                              "w-5 h-5 text-primary flex-shrink-0 transition-transform duration-200",
                              expandedMobile === entry.id && "rotate-180"
                            )}
                          />
                        </button>

                        {/* Accordion sub-links */}
                        {expandedMobile === entry.id && entry.sections && (
                          <div className="pb-5 space-y-5 pl-1">
                            {entry.href && (
                              <Link
                                href={entry.href}
                                className={cn(
                                  "inline-flex items-center gap-1.5 font-tech uppercase tracking-wider text-sm py-1 transition-colors",
                                  location === entry.href ? "text-primary" : "text-white/80 hover:text-primary"
                                )}
                                data-testid={`link-nav-mobile-overview-${entry.id}`}
                              >
                                {entry.title} <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                            {entry.sections.map((section, si) => (
                              <div key={si}>
                                {section.label && (
                                  <p className="text-[10px] font-tech uppercase tracking-widest text-white/30 mb-2">
                                    {section.label}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-x-5 gap-y-2">
                                  {section.items.map((item) => (
                                    <Link
                                      key={item.href}
                                      href={item.href}
                                      className={cn(
                                        "font-tech uppercase tracking-wider text-sm py-1 transition-colors",
                                        location === item.href ? "text-primary" : "text-white/60 hover:text-primary"
                                      )}
                                    >
                                      {item.title}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Mobile footer utilities */}
            <div className="px-6 py-6 border-t border-white/10 flex flex-col gap-5">
              {!authLoading && !isAuthenticated && (
                <a
                  href="/login"
                  className="flex items-center gap-2 text-white/60 font-tech uppercase tracking-widest text-sm hover:text-primary transition-colors"
                  data-testid="link-login-menu"
                >
                  <LogIn className="w-4 h-4" />
                  {t("nav.logIn")}
                </a>
              )}

              {/* Language row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white/25 font-tech uppercase tracking-widest text-[10px] mr-1">
                  {t("nav.language") || "Lang"}
                </span>
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn(
                      "font-tech uppercase tracking-widest text-xs px-2.5 py-1.5 border transition-all",
                      lang === l
                        ? "bg-primary text-black border-primary"
                        : "border-white/20 text-white/50 hover:border-primary/50 hover:text-white"
                    )}
                    data-testid={`button-lang-mobile-${l}`}
                  >
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search modal */}
      <SearchModal open={searchOpen} onClose={closeSearch} />
    </>
  );
}
