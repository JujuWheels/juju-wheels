import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCollectionByHandle, type Collection } from "@/lib/shopify";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, Loader2, Zap, BookOpen, Download, CheckCircle2, XCircle, AlertTriangle, ExternalLink, ImageOff } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";

function FitmentImage({ src, alt, fallbackLabel, className, testId }: {
  src: string;
  alt: string;
  fallbackLabel: string;
  className?: string;
  testId?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-white/[0.03] border border-white/8 text-white/20 ${className ?? "h-40"}`}>
        <ImageOff className="w-6 h-6" />
        <span className="font-tech text-[10px] uppercase tracking-wider text-center px-2">{fallbackLabel}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`w-full object-contain ${className ?? "max-h-40"}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      data-testid={testId}
    />
  );
}

const STANCEPARTS_HANDLE = "stanceparts";

const COMPATIBLE_BRANDS = [
  "KW Suspension", "BC Racing", "MeisterR", "Tein", "Öhlins",
  "Fortune Auto", "Stance", "HSD", "Bilstein", "Megan Racing",
];

export default function StancePartsPage() {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'all' | 'cups' | 'tankless' | 'complete'>('all');

  const { data: collection, isLoading, error } = useQuery<Collection | null>({
    queryKey: ["collection", STANCEPARTS_HANDLE],
    queryFn: () => getCollectionByHandle(STANCEPARTS_HANDLE),
  });

  const products = collection?.products?.edges?.map((e) => e.node) || [];

  type Product = (typeof products)[number];

  const CATEGORIES: { key: string; label: string; tag: string; products: Product[] }[] = [
    {
      key: 'cups',
      label: t('stanceparts.catCups') || 'Air Cups',
      tag: t('stanceparts.catCupsTag') || 'Cups only — no compressor',
      products: products.filter((p) => /aircup/i.test(p.title) && !/kit/i.test(p.title)),
    },
    {
      key: 'tankless',
      label: t('stanceparts.catTankless') || 'Tankless Kits',
      tag: t('stanceparts.catTanklessTag') || 'Compressor included — no tank',
      products: products.filter((p) => /tankless/i.test(p.title)),
    },
    {
      key: 'complete',
      label: t('stanceparts.catComplete') || 'Complete Kits',
      tag: t('stanceparts.catCompleteTag') || 'Compressor + tank included',
      products: products.filter((p) => /complete/i.test(p.title)),
    },
    {
      key: 'other',
      label: t('stanceparts.catOther') || 'Accessories',
      tag: '',
      products: products.filter(
        (p) =>
          !/aircup/i.test(p.title) &&
          !/tankless/i.test(p.title) &&
          !/complete/i.test(p.title)
      ),
    },
  ].filter((c) => c.products.length > 0);

  const coverageBadge = (title: string) => {
    if (/front\s*\+\s*rear|rear/i.test(title)) return t('stanceparts.coverageFrontRear') || 'Front + Rear';
    if (/front/i.test(title)) return t('stanceparts.coverageFront') || 'Front';
    return null;
  };

  const SPEC_POINTS = [
    { label: t('stanceparts.specLiftHeightLabel') || 'Lift height', value: t('stanceparts.specLiftHeightValue') || 'Up to 50mm' },
    { label: t('stanceparts.specFitmentLabel') || 'Fitment', value: t('stanceparts.specFitmentValue') || 'Universal — 90%+ of coilovers' },
    { label: t('stanceparts.specInstallLabel') || 'Installation', value: t('stanceparts.specInstallValue') || 'No permanent modifications' },
    { label: t('stanceparts.specOriginLabel') || 'Origin', value: t('stanceparts.specOriginValue') || 'Netherlands' },
    { label: t('stanceparts.specShippingLabel') || 'Shipping', value: t('stanceparts.specShippingValue') || 'Worldwide' },
  ];

  const HOW_IT_WORKS = [
    {
      step: "01",
      title: t('stanceparts.step1Title') || 'Install the Air Cup',
      desc: t('stanceparts.step1Desc') || 'The Air Cup mounts directly onto your existing coilover — no drilling, no cutting, no permanent modifications.',
    },
    {
      step: "02",
      title: t('stanceparts.step2Title') || 'Connect & Pressurise',
      desc: t('stanceparts.step2Desc') || 'Hook up the air line to the onboard compressor or an external source. The cup inflates in seconds.',
    },
    {
      step: "03",
      title: t('stanceparts.step3Title') || 'Lift Up To 50mm',
      desc: t('stanceparts.step3Desc') || 'Air pressure raises your car up to 50mm, clearing speed bumps, driveways and parking ramps — then drop it back to stance height instantly.',
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="StanceParts Air Cup Lift System — Official NL | Juju Wheels"
        description="Official StanceParts retailer. The Air Cup Lift System mounts on any coilover and raises your car up to 50mm — clear obstacles, drop back to stance height in seconds."
        itemListJsonLd={products.length > 0 ? { items: products.map((p) => ({ name: p.title, url: `https://jujuwheels.com/products/${p.handle}` })) } : undefined}
        brandJsonLd={{
          name: "StanceParts",
          url: "https://jujuwheels.com/stanceparts",
          description: "StanceParts designs the Air Cup Lift System — a bolt-on pneumatic lift that mounts on any coilover, raising your car up to 50mm with no permanent modifications.",
        }}
      />

      {/* Hero */}
      <section className="pt-28 pb-20 relative overflow-hidden border-b border-white/10" data-testid="section-stanceparts-hero">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(233,211,85,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(233,211,85,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6">
                <img
                  src="/stanceparts-logo.png"
                  alt="StanceParts"
                  className="h-14 md:h-20 w-auto mb-4"
                />
                <span className="border border-primary/40 text-primary font-tech uppercase tracking-[0.3em] text-[10px] px-3 py-1.5">
                  {t('stanceparts.officialRetailerBadge') || 'Official Retailer'}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white uppercase leading-none mb-5" data-testid="text-stanceparts-hero-title">
                {t('stanceparts.heroTitle') || 'StanceParts Air Cup'}<br />
                <span className="text-primary">{t('stanceparts.heroTitleAccent') || 'Lift System'}</span>
              </h1>
              <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
                {t('stanceparts.heroDesc') || 'Stay slammed on the street, raise up to 50mm whenever you need to. The Air Cup installs on your existing coilover in minutes — no permanent mods, no compromises.'}
              </p>
              <div className="block lg:hidden relative mb-8">
                <img
                  src="/stanceparts/sp-cups-orange.jpg"
                  alt="StanceParts Air Cups on coilover springs"
                  className="w-full max-h-72 object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent" />
              </div>
              <div className="flex flex-wrap gap-4">
                <a href="#shop" data-testid="button-stanceparts-shop">
                  <Button
                    size="lg"
                    className="bg-primary text-black hover:bg-white hover:text-black font-tech uppercase tracking-widest text-sm h-14 px-10 rounded-none"
                  >
                    {t('general.shopNow') || 'Shop Now'} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </a>
                <a
                  href="https://wa.me/31611601627?text=Hi%2C%20I%20have%20a%20question%20about%20StanceParts%20Air%20Cup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-14 px-8 border border-white/20 text-white font-tech uppercase tracking-widest text-sm hover:border-primary hover:text-primary transition-colors"
                  data-testid="link-stanceparts-whatsapp-hero"
                >
                  {t('stanceparts.askWhatsApp') || 'Ask via WhatsApp'}
                </a>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <img
                src="/stanceparts/sp-cups-orange.jpg"
                alt="StanceParts Air Cups on coilover springs"
                className="w-full max-w-sm mx-auto object-cover"
                style={{ maxHeight: '560px', objectPosition: 'center' }}
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section id="shop" className="py-20 border-b border-white/10" data-testid="section-stanceparts-products">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <span className="text-primary font-tech uppercase tracking-[0.3em] text-xs mb-3 block">{t('stanceparts.shopRangeLabel') || 'StanceParts collection'}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase mb-8">{t('stanceparts.shopRangeTitle') || 'Shop the Range'}</h2>
            <div className="flex flex-wrap gap-2" data-testid="filter-stanceparts-categories">
              {([
                { key: 'all',      label: 'All' },
                { key: 'cups',     label: 'Air Cups' },
                { key: 'tankless', label: 'Tankless Kits' },
                { key: 'complete', label: 'Full Kits' },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  data-testid={`filter-btn-${f.key}`}
                  className={`font-tech text-xs uppercase tracking-widest px-5 py-2.5 border transition-colors ${
                    activeFilter === f.key
                      ? 'bg-primary text-black border-primary'
                      : 'bg-transparent text-white/50 border-white/15 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading && (
            <div className="py-24 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && (error || products.length === 0) && (
            <div className="py-20 text-center border border-white/10">
              <Zap className="w-10 h-10 text-primary/20 mx-auto mb-4" />
              <p className="text-white/50 font-tech uppercase tracking-wider text-sm mb-2" data-testid="text-stanceparts-empty">
                {t('stanceparts.productsEmpty') || 'Products loading soon'}
              </p>
              <p className="text-white/30 text-xs">
                {t('stanceparts.productsEmptyNote') || 'Contact us via WhatsApp to order or ask about availability.'}
              </p>
            </div>
          )}

          {!isLoading && products.length > 0 && (
            <div className="space-y-16" data-testid="grid-stanceparts-products">
              {CATEGORIES.filter((cat) => activeFilter === 'all' || cat.key === activeFilter).map((cat) => (
                <div key={cat.key}>
                  {/* Category header */}
                  <div className="flex items-baseline gap-4 mb-6 pb-4 border-b border-white/10">
                    <h3 className="text-2xl font-display font-bold text-white uppercase">{cat.label}</h3>
                    {cat.tag && (
                      <span className="text-white/30 font-tech text-[10px] uppercase tracking-[0.25em]">{cat.tag}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Photo strip */}
      <section className="border-b border-white/10 overflow-hidden" data-testid="section-stanceparts-photos">
        <div className="grid grid-cols-3">
          <div className="aspect-[4/3] overflow-hidden">
            <img src="/stanceparts/sp-before-after.jpg" alt="StanceParts cup vs standard coilover comparison" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="aspect-[4/3] overflow-hidden border-x border-white/10">
            <img src="/stanceparts/sp-closeup.jpg" alt="StanceParts Air Cup close-up" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="aspect-[4/3] overflow-hidden">
            <img src="/stanceparts/sp-honda.jpg" alt="StanceParts Air Cup installed on Honda coilover" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
        </div>
      </section>

      {/* Spec strip */}
      <section className="border-b border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap divide-x divide-white/10">
            {SPEC_POINTS.map((s) => (
              <div key={s.label} className="flex-1 min-w-[140px] px-6 py-5">
                <span className="block text-[10px] font-tech uppercase tracking-[0.25em] text-white/30 mb-1">{s.label}</span>
                <span className="block text-sm font-display text-white uppercase" data-testid={`text-spec-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-b border-white/10" data-testid="section-how-it-works">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <span className="text-primary font-tech uppercase tracking-[0.3em] text-xs mb-3 block">{t('stanceparts.howItWorksLabel') || 'Simple setup'}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase">{t('stanceparts.howItWorksTitle') || 'How It Works'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={item.step}
                className={`p-8 relative ${i < HOW_IT_WORKS.length - 1 ? "border-b md:border-b-0 md:border-r border-white/10" : ""}`}
                data-testid={`card-how-it-works-${item.step}`}
              >
                <span className="text-[80px] font-display font-bold text-white/4 leading-none absolute top-4 right-6 select-none">{item.step}</span>
                <div className="relative z-10">
                  <span className="text-primary font-tech text-xs uppercase tracking-[0.3em] mb-4 block">{item.step}</span>
                  <h3 className="text-xl font-display text-white uppercase mb-3">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary z-20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manual download */}
      <section className="border-b border-white/10 bg-white/[0.02]" data-testid="section-stanceparts-manual">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-12 h-12 border border-primary/30 bg-primary/5 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="block text-[10px] font-tech uppercase tracking-[0.25em] text-white/30 mb-0.5">{t('stanceparts.manualLabel') || 'Official document'}</span>
                <span className="block text-sm font-display text-white uppercase">{t('stanceparts.manualTitle') || 'Air Cup User Manual'}</span>
              </div>
            </div>
            <p className="text-white/40 text-sm leading-relaxed flex-1">
              {t('stanceparts.manualDesc') || 'Full installation guide covering fitment check, coilover assembly, air line routing, electrical wiring, operating instructions, maintenance and troubleshooting.'}
            </p>
            <div className="flex gap-3 shrink-0">
              <a
                href="/stanceparts-manual.pdf"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-stanceparts-manual-view"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:border-primary hover:text-primary font-tech uppercase tracking-widest text-xs h-9 px-5 rounded-none bg-transparent gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {t('stanceparts.manualView') || 'View'}
                </Button>
              </a>
              <a
                href="/stanceparts-manual.pdf"
                download="StanceParts-AirCup-Manual.pdf"
                data-testid="link-stanceparts-manual-download"
              >
                <Button
                  size="sm"
                  className="bg-primary text-black hover:bg-white hover:text-black font-tech uppercase tracking-widest text-xs h-9 px-5 rounded-none gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('stanceparts.manualDownload') || 'Download PDF'}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Fitment Requirements Guide */}
      <section className="py-20 border-b border-white/10" data-testid="section-fitment-requirements">
        <div className="container mx-auto px-4">

          {/* Section header */}
          <div className="mb-12">
            <span className="text-primary font-tech uppercase tracking-[0.3em] text-xs mb-3 block">Official Guide</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase mb-3" data-testid="heading-fitment-requirements">
              Fitment Requirements
            </h2>
            <p className="text-white/50 text-base max-w-xl">
              Air cups fit any coilover brand that meets these requirements. Follow all 5 checks before ordering.
            </p>
          </div>

          {/* Weight limit banner */}
          <div
            className="border border-primary/60 bg-primary/10 px-6 py-5 mb-12 flex flex-col sm:flex-row sm:items-center gap-3"
            data-testid="banner-weight-limit"
          >
            <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
            <div>
              <span className="block text-primary font-display font-bold uppercase tracking-wider text-sm">
                Max total car weight: 2000 kg / 4400 lbs
              </span>
              <span className="block text-white/50 text-xs mt-0.5 font-tech">
                Limited for 40–45 mm cups: 1750 kg / 3850 lbs
              </span>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-0 border border-white/10 mb-12">

            {/* Step 1 */}
            <div className="border-b border-white/10" data-testid="card-fitment-step-1">
              <div className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-primary font-display font-bold text-4xl leading-none select-none">01</span>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white uppercase mb-1">Coilover Clearance &amp; Springs</h3>
                    <p className="text-white/40 text-sm font-tech uppercase tracking-wider">Check clearance &amp; spring type</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-primary font-tech uppercase tracking-[0.2em] text-xs mb-3">Clearance</h4>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                      Make sure you have enough clearance around the coilovers. The air cups are <strong className="text-white">120 mm in diameter</strong>, and the fitting is <strong className="text-white">17 mm</strong> (110 mm cups available on request).
                    </p>
                    <div className="bg-white/[0.03] border border-white/8 p-4">
                      <FitmentImage
                        src="/stanceparts/guide/Clearance.jpg"
                        alt="Coilover clearance diagram"
                        fallbackLabel="Clearance Diagram — 120 mm body, 17 mm top"
                        className="max-h-48"
                        testId="img-clearance-diagram"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-primary font-tech uppercase tracking-[0.2em] text-xs mb-3">Spring Type</h4>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                      Air cups can <strong className="text-white">only</strong> be installed on <strong className="text-white">linear springs</strong>. They will not fit on shaped or progressive springs. In most cases it is possible to replace shaped springs with linear ones.
                    </p>
                    <div className="flex gap-3">
                      <div className="flex-1 border border-green-500/30 bg-green-500/5 px-4 py-3 flex items-center gap-3" data-testid="badge-spring-linear-ok">
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        <div>
                          <span className="block text-green-400 font-tech text-[10px] uppercase tracking-widest">Compatible</span>
                          <span className="block text-white text-xs font-display uppercase">Linear / Single</span>
                        </div>
                      </div>
                      <div className="flex-1 border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-center gap-3" data-testid="badge-spring-shaped-no">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <div>
                          <span className="block text-red-400 font-tech text-[10px] uppercase tracking-widest">Not Compatible</span>
                          <span className="block text-white text-xs font-display uppercase">Progressive / Dual</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 bg-white/[0.03] border border-white/8 p-4">
                      <FitmentImage
                        src="/stanceparts/guide/straight-1.jpg"
                        alt="Linear vs shaped spring comparison"
                        fallbackLabel="Linear (OK) vs shaped (not OK) spring types"
                        className="max-h-40"
                        testId="img-spring-types"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-b border-white/10" data-testid="card-fitment-step-2">
              <div className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-primary font-display font-bold text-4xl leading-none select-none">02</span>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white uppercase mb-1">Shaft &amp; Spring Diameters</h3>
                    <p className="text-white/40 text-sm font-tech uppercase tracking-wider">Measure with a caliper</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-primary font-tech uppercase tracking-[0.2em] text-xs mb-3">Damper Shaft</h4>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                      Measure the <strong className="text-white">thickest part</strong> of the shaft with a caliper, <strong className="text-white">below any rings or clips</strong>. Available shaft sizes:
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4" data-testid="list-shaft-sizes">
                      {["12.5mm","14mm","15mm","16mm","18mm","20mm","22mm","25mm","40mm","44mm","44.2mm","44.5mm","45mm"].map(size => (
                        <span key={size} className="border border-primary/30 text-primary font-tech text-[10px] uppercase tracking-wider px-2 py-1">
                          {size}
                        </span>
                      ))}
                    </div>
                    <div className="bg-white/[0.03] border border-white/8 p-4">
                      <FitmentImage
                        src="/stanceparts/guide/measuring.jpg"
                        alt="Measuring damper shaft diameter"
                        fallbackLabel="Measure thickest part of shaft below any rings"
                        className="max-h-40"
                        testId="img-measuring-shaft"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-primary font-tech uppercase tracking-[0.2em] text-xs mb-3">Spring Diameter</h4>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                      Check your spring's outer and inner diameter before ordering.
                    </p>
                    <div className="space-y-2 mb-4" data-testid="list-spring-specs">
                      {[
                        { label: "Max outer diameter", value: "98 mm (89 mm for 110 mm cups)" },
                        { label: "Min inner diameter", value: "60 mm (57 mm on request)" },
                      ].map(item => (
                        <div key={item.label} className="border border-white/8 bg-white/[0.02] px-4 py-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <span className="text-white/50 font-tech text-xs uppercase tracking-wider">{item.label}</span>
                          <span className="text-white font-display text-sm uppercase">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-white/30 text-xs leading-relaxed">
                      Tip: Look for a code on the spring such as "62-200-008" — the first number (62) indicates the inner diameter in mm.
                    </p>
                    <div className="mt-3 bg-white/[0.03] border border-white/8 p-4">
                      <FitmentImage
                        src="https://www.stanceparts.com/wp-content/uploads/Measure.png"
                        alt="Spring diameter measurement diagram"
                        fallbackLabel="Spring diameter — OD max 98 mm, ID min 60 mm"
                        className="max-h-40"
                        testId="img-spring-diameter"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border-b border-white/10" data-testid="card-fitment-step-3">
              <div className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-primary font-display font-bold text-4xl leading-none select-none">03</span>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white uppercase mb-1">Ride Height Stack</h3>
                    <p className="text-white/40 text-sm font-tech uppercase tracking-wider">Check remaining thread on your coilovers</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-primary font-tech uppercase tracking-[0.2em] text-xs mb-3">Height Impact</h4>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                      In most cases the air cup will consume between <strong className="text-white">20 and 30 mm</strong> of height. The cup's stack height is 20 mm, but with most coilovers the top hat sits on top, adding ~10 mm.
                    </p>
                    <p className="text-white/60 text-sm leading-relaxed">
                      If there is enough thread left on the coilovers to lower the springs, it won't be a problem. Otherwise, shorter springs are required.
                    </p>
                    <div className="mt-4 border border-primary/20 bg-primary/5 px-4 py-3">
                      <span className="text-primary font-tech text-xs uppercase tracking-widest">Stack consumed</span>
                      <span className="block text-white font-display font-bold text-2xl mt-1">20–30 mm</span>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/8 p-4">
                    <FitmentImage
                      src="/stanceparts/guide/height-stack.jpg"
                      alt="Height stack diagram"
                      fallbackLabel="Height stack — 20 mm cup + ~10 mm top hat = 20–30 mm total"
                      className="max-h-48"
                      testId="img-height-stack"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="border-b border-white/10" data-testid="card-fitment-step-4">
              <div className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-primary font-display font-bold text-4xl leading-none select-none">04</span>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white uppercase mb-1">Droop &amp; Spring Rate</h3>
                    <p className="text-white/40 text-sm font-tech uppercase tracking-wider">Ensure enough travel for full 50 mm lift</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-primary font-tech uppercase tracking-[0.2em] text-xs mb-3">What Is Droop?</h4>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                      Droop (also called rebound) is the amount of travel between ride height and full extension. The air cup lift requires droop from the coilovers — without enough droop, the strut tops out before reaching full lift.
                    </p>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                      Set minimal preload to maximise droop. Too much preload reduces available travel.
                    </p>
                    <div className="bg-white/[0.03] border border-white/8 p-4">
                      <FitmentImage
                        src="/stanceparts/guide/Droop-rebound.jpg"
                        alt="Droop and rebound diagram"
                        fallbackLabel="Droop — distance between ride height and full extension"
                        className="max-h-40"
                        testId="img-droop-diagram"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-primary font-tech uppercase tracking-[0.2em] text-xs mb-3">Spring Rate Guide</h4>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                      Higher spring rates reduce droop. Use the table below to determine if helper springs are needed.
                    </p>
                    <div className="border border-white/10" data-testid="table-spring-rates">
                      {[
                        { rate: "Stock spring rates", status: "OK", color: "green" },
                        { rate: "Higher than stock", status: "Helper springs recommended", color: "yellow" },
                        { rate: "Extreme / coilover max", status: "Helper springs required", color: "red" },
                      ].map((row) => (
                        <div
                          key={row.rate}
                          className="flex items-center gap-4 px-4 py-3 border-b border-white/8 last:border-b-0"
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              row.color === "green"
                                ? "bg-green-400"
                                : row.color === "yellow"
                                ? "bg-primary"
                                : "bg-red-400"
                            }`}
                          />
                          <span className="text-white/60 font-tech text-xs uppercase tracking-wider flex-1">{row.rate}</span>
                          <span
                            className={`font-tech text-[10px] uppercase tracking-widest shrink-0 ${
                              row.color === "green"
                                ? "text-green-400"
                                : row.color === "yellow"
                                ? "text-primary"
                                : "text-red-400"
                            }`}
                          >
                            {row.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div data-testid="card-fitment-step-5">
              <div className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-primary font-display font-bold text-4xl leading-none select-none">05</span>
                  <div>
                    <h3 className="text-xl font-display font-bold text-white uppercase mb-1">Separate Rear Spring &amp; Shock</h3>
                    <p className="text-white/40 text-sm font-tech uppercase tracking-wider">Custom rear cups for non-standard setups</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-white/60 text-sm leading-relaxed mb-6">
                      Custom rear cups are available for a limited selection of cars with a separate rear spring and shock. Linear springs required — minimum installed length: <strong className="text-white">150 mm</strong>.
                    </p>
                    <h4 className="text-primary font-tech uppercase tracking-[0.2em] text-xs mb-3">Available Versions</h4>
                    <div className="space-y-2 mb-6">
                      {[
                        {
                          title: "50 mm Custom Rear Cup",
                          specs: [
                            "Height adjuster thread diameter: max 50 mm",
                            "Min spring inner diameter: 62 mm",
                            "Max spring outer diameter: 105 mm",
                          ],
                        },
                        {
                          title: "53 mm Custom Rear Cup",
                          specs: [
                            "Height adjuster thread diameter: max 53 mm",
                            "Min spring inner diameter: 65 mm",
                            "Max spring outer diameter: 105 mm",
                          ],
                        },
                      ].map((cup) => (
                        <div key={cup.title} className="border border-white/8 bg-white/[0.02] p-4">
                          <span className="block text-white font-display text-sm uppercase mb-2">{cup.title}</span>
                          {cup.specs.map((spec) => (
                            <div key={spec} className="flex items-start gap-2 mb-1">
                              <span className="w-1 h-1 bg-primary/60 rounded-full mt-1.5 shrink-0" />
                              <span className="text-white/50 text-xs">{spec}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <h4 className="text-primary font-tech uppercase tracking-[0.2em] text-xs mb-3">Cup Specifications</h4>
                    <div className="grid grid-cols-3 gap-2" data-testid="specs-custom-rear-cup">
                      {[
                        { label: "Diameter", value: "130 mm" },
                        { label: "Height", value: "83 mm" },
                        { label: "Stroke", value: "25 mm" },
                        { label: "Actual lift", value: "40–50 mm" },
                        { label: "Height consumed", value: "30 mm" },
                      ].map((s) => (
                        <div key={s.label} className="border border-white/8 bg-white/[0.02] px-3 py-3 text-center">
                          <span className="block text-white/30 font-tech text-[9px] uppercase tracking-widest mb-1">{s.label}</span>
                          <span className="block text-primary font-display font-bold text-sm uppercase">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/[0.03] border border-white/8 p-4">
                      <FitmentImage
                        src="/stanceparts/guide/Custom-rear-cups-.jpg"
                        alt="Custom rear cup"
                        fallbackLabel="Custom rear cup — 130 mm diameter, 83 mm height"
                        className="max-h-52"
                        testId="img-custom-rear-cup"
                      />
                    </div>
                    <div className="bg-white/[0.03] border border-white/8 p-4">
                      <FitmentImage
                        src="/stanceparts/guide/Custom-rear-cups-with-springs.jpg"
                        alt="Custom rear cups with springs installed"
                        fallbackLabel="Custom rear cup with springs — min 150 mm installed length"
                        className="max-h-48"
                        testId="img-custom-rear-cup-springs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick checklist summary */}
          <div className="border border-white/10 bg-white/[0.02] p-8 mb-8" data-testid="card-fitment-checklist">
            <h3 className="text-xl font-display font-bold text-white uppercase mb-6">Quick Checklist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                "120 mm clearance around coilover body & 17 mm top clearance",
                "Linear springs only — no shaped or progressive springs",
                "Shaft diameter matches an available size; spring OD ≤ 98 mm, ID ≥ 60 mm",
                "20–30 mm spare thread for height adjustment; sufficient droop/rebound",
                "Car weight ≤ 2000 kg (1750 kg for 40–45 mm cups)",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 border border-white/8 px-4 py-3" data-testid={`checklist-item-${i + 1}`}>
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-white/60 text-xs leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href="https://www.stanceparts.com/fitment/"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-view-full-fitment-guide"
            >
              <Button
                size="lg"
                className="bg-primary text-black hover:bg-white hover:text-black font-tech uppercase tracking-widest text-sm h-14 px-10 rounded-none"
              >
                View Full Fitment Manual <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>

        </div>
      </section>

      {/* Fitment compatibility */}
      <section className="py-20 border-b border-white/10 bg-white/[0.015]" data-testid="section-stanceparts-fitment">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary font-tech uppercase tracking-[0.3em] text-xs mb-3 block">{t('stanceparts.fitmentLabel') || 'Universal fit'}</span>
              <h2 className="text-4xl font-display font-bold text-white uppercase mb-4">{t('stanceparts.fitmentTitle') || 'Fits Your Coilovers?'}</h2>
              <p className="text-white/60 leading-relaxed mb-6">
                {t('stanceparts.fitmentDesc1') || 'The Air Cup is designed to work with the vast majority of popular coilover brands — KW, BC Racing, MeisterR, Tein, Ohlins, Fortune Auto, and many more.'}
              </p>
              <p className="text-white/40 text-sm leading-relaxed mb-8">
                {t('stanceparts.fitmentDesc2') || "Not sure if it fits your setup? Use our Vehicle Fitment tool to check your car's specs, then drop us a WhatsApp message — we'll confirm compatibility before you order."}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/vehicle-fitment" aria-label="Check Vehicle Fitment">
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:border-primary hover:text-primary font-tech uppercase tracking-widest text-xs h-11 px-6 rounded-none bg-transparent"
                    data-testid="button-stanceparts-check-fitment"
                  >
                    {t('stanceparts.checkFitmentBtn') || 'Check Vehicle Fitment'}
                  </Button>
                </Link>
                <a
                  href="https://wa.me/31611601627?text=Does%20the%20StanceParts%20Air%20Cup%20fit%20my%20coilovers%3F"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-stanceparts-whatsapp-fitment"
                >
                  <Button
                    className="bg-primary text-black hover:bg-white hover:text-black font-tech uppercase tracking-widest text-xs h-11 px-6 rounded-none"
                  >
                    {t('stanceparts.askWhatsApp') || 'Ask via WhatsApp'}
                  </Button>
                </a>
              </div>
            </div>
            <div className="space-y-3">
              {COMPATIBLE_BRANDS.map((brand) => (
                <div key={brand} className="flex items-center gap-3 border border-white/8 bg-white/[0.02] px-4 py-3">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                  <span className="text-white/70 font-tech text-sm uppercase tracking-wider">{brand}</span>
                  <span className="ml-auto text-primary text-[10px] font-tech uppercase tracking-widest">Compatible</span>
                </div>
              ))}
              <p className="text-white/30 text-xs pt-1">{t('stanceparts.moreCoilovers') || '+ many more. When in doubt, ask us.'}</p>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
