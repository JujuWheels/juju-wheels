import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllCollectionProducts, type Product } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Zap, ShieldCheck, Clock, ImageOff, ChevronDown, RotateCcw, MessageCircle, Phone, Mail } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";

function FitmentImage({ src, alt, fallbackLabel, className, testId }: {
  src: string; alt: string; fallbackLabel: string; className?: string; testId?: string;
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
  return <img src={src} alt={alt} className={`w-full object-contain ${className ?? "max-h-40"}`} onError={() => setFailed(true)} data-testid={testId} />;
}

const BC_RACING_HANDLE = "bc-racing";

// Car make detection. BC Racing titles are inconsistent: some lead with the make,
// some with a model/chassis code, some with prefix noise (TRUE, CAM/CAS, CENTRAL,
// FORK, 45MM TRUE REAR, etc). We scan every token for a known make alias first,
// then fall back to a model/chassis -> make lookup.
const MAKE_ALIASES: Record<string, string> = {
  BMW: "BMW", HONDA: "Honda", HON: "Honda", TOYOTA: "Toyota", TOY: "Toyota",
  NISSAN: "Nissan", NISS: "Nissan", NIS: "Nissan", SUBARU: "Subaru", SUB: "Subaru",
  AUDI: "Audi", MAZDA: "Mazda", FORD: "Ford", MITSUBISHI: "Mitsubishi", MITSI: "Mitsubishi", MIT: "Mitsubishi",
  HYUNDAI: "Hyundai", SKODA: "Skoda", LEXUS: "Lexus", CHEVROLET: "Chevrolet", CHEVY: "Chevrolet",
  INFINITI: "Infiniti", VOLVO: "Volvo", SUZUKI: "Suzuki", PORSCHE: "Porsche", PEUGEOT: "Peugeot",
  TESLA: "Tesla", RENAULT: "Renault", REN: "Renault", MINI: "Mini", DODGE: "Dodge", KIA: "Kia",
  HOLDEN: "Holden", SCION: "Scion", CHRYSLER: "Chrysler", PONTIAC: "Pontiac", DAIHATSU: "Daihatsu",
  SEAT: "SEAT", JAGUAR: "Jaguar", PROTON: "Proton", CADILLAC: "Cadillac", VAUXHALL: "Vauxhall",
  BYD: "BYD", FIAT: "Fiat", MASERATI: "Maserati", MG: "MG", SAAB: "Saab", LANCIA: "Lancia",
  LUXGEN: "Luxgen", LOTUS: "Lotus", SMART: "Smart", FERRARI: "Ferrari", GEELY: "Geely", LADA: "Lada",
  BUICK: "Buick", CHANGAN: "Changan", CITROEN: "Citroen", OPEL: "Opel", JEEP: "Jeep", CHERY: "Chery",
  CMC: "CMC", TRUMPCHI: "Trumpchi", HAFEI: "Hafei", ROEWE: "Roewe", ACURA: "Acura", GENESIS: "Genesis",
  VW: "Volkswagen", VOLKSWAGEN: "Volkswagen",
  MERC: "Mercedes-Benz", MERCEDES: "Mercedes-Benz", BENZ: "Mercedes-Benz",
  ALFA: "Alfa Romeo", LYNK: "Lynk & Co", LANDROVER: "Land Rover",
  ASTON: "Aston Martin", GR: "Toyota",
};

const MODEL_TO_MAKE: Record<string, string> = {
  // BMW chassis codes
  E30: "BMW", E36: "BMW", E46: "BMW", E60: "BMW", E61: "BMW", E63: "BMW", E64: "BMW",
  E81: "BMW", E82: "BMW", E83: "BMW", E84: "BMW", E85: "BMW", E87: "BMW", E88: "BMW",
  E89: "BMW", E90: "BMW", E91: "BMW", E92: "BMW", E93: "BMW", F10: "BMW", F11: "BMW",
  F20: "BMW", F21: "BMW", F22: "BMW", F23: "BMW", F30: "BMW", F31: "BMW", F32: "BMW",
  F33: "BMW", F34: "BMW", F36: "BMW", F80: "BMW", F82: "BMW", F87: "BMW", G20: "BMW",
  G21: "BMW", G22: "BMW", G80: "BMW", G82: "BMW",
  // Audi
  A1: "Audi", A3: "Audi", A4: "Audi", A5: "Audi", A6: "Audi", A7: "Audi", A8: "Audi",
  S3: "Audi", S4: "Audi", S5: "Audi", RS3: "Audi", RS4: "Audi", RS5: "Audi", RS6: "Audi",
  Q3: "Audi", Q5: "Audi", Q7: "Audi", Q8: "Audi", R8: "Audi", TT: "Audi", TTS: "Audi",
  // Volkswagen
  GOLF: "Volkswagen", POLO: "Volkswagen", PASSAT: "Volkswagen", JETTA: "Volkswagen",
  SCIROCCO: "Volkswagen", BEETLE: "Volkswagen", TOUAREG: "Volkswagen", TIGUAN: "Volkswagen",
  // Toyota
  COROLLA: "Toyota", ALTIS: "Toyota", CAMRY: "Toyota", CROWN: "Toyota", PRIUS: "Toyota",
  RAV4: "Toyota", SUPRA: "Toyota", MR2: "Toyota", CELICA: "Toyota", YARIS: "Toyota",
  AURIS: "Toyota", "86": "Toyota", GT86: "Toyota", NOAH: "Toyota", VOXY: "Toyota",
  CHASER: "Toyota", ALTEZZA: "Toyota",
  // Honda
  CIVIC: "Honda", INTEGRA: "Honda", NSX: "Honda", FREED: "Honda", JAZZ: "Honda",
  FIT: "Honda", ACCORD: "Honda", CRZ: "Honda", PRELUDE: "Honda", S2000: "Honda",
  STEP: "Honda", WGN: "Honda",
  // Nissan
  "300ZX": "Nissan", "350Z": "Nissan", "370Z": "Nissan", "180SX": "Nissan", "240SX": "Nissan",
  SKYLINE: "Nissan", SILVIA: "Nissan", GTR: "Nissan", "GT-R": "Nissan", MARCH: "Nissan",
  MURANO: "Nissan", STAGEA: "Nissan", "X-TRAIL": "Nissan", SERENA: "Nissan", FAIRLADY: "Nissan",
  S13: "Nissan", S14: "Nissan", S15: "Nissan", R32: "Nissan", R33: "Nissan", R34: "Nissan",
  R35: "Nissan", Z32: "Nissan", Z33: "Nissan", Z34: "Nissan",
  // Subaru
  FORESTER: "Subaru", LEGACY: "Subaru", BRZ: "Subaru", IMPREZA: "Subaru", WRX: "Subaru",
  STI: "Subaru", GRB: "Subaru", OUTBACK: "Subaru",
  // Mitsubishi
  EVO: "Mitsubishi", LANCER: "Mitsubishi", MIRAGE: "Mitsubishi", OUTLANDER: "Mitsubishi",
  FTO: "Mitsubishi", GTO: "Mitsubishi", CZ4A: "Mitsubishi",
  // Mercedes-Benz
  "E-CLASS": "Mercedes-Benz", "C-CLASS": "Mercedes-Benz", "A-CLASS": "Mercedes-Benz",
  "S-CLASS": "Mercedes-Benz", C63: "Mercedes-Benz", CLS63: "Mercedes-Benz",
  SL55: "Mercedes-Benz", SL63: "Mercedes-Benz",
  // Peugeot
  "208": "Peugeot", "308": "Peugeot", "206": "Peugeot", "207": "Peugeot", RCZ: "Peugeot",
  // Opel
  ASTRA: "Opel", CORSA: "Opel", INSIGNIA: "Opel",
  // Alfa Romeo
  STELVIO: "Alfa Romeo", GIULIA: "Alfa Romeo", GIULIETTA: "Alfa Romeo", MITO: "Alfa Romeo",
  // Volvo
  XC60: "Volvo", XC90: "Volvo", XC40: "Volvo", V60: "Volvo", S60: "Volvo",
  // Infiniti
  FX50S: "Infiniti", FX35: "Infiniti", FX37: "Infiniti", Q50: "Infiniti", Q60: "Infiniti",
  G35: "Infiniti", G37: "Infiniti",
  // Lexus
  RC200T: "Lexus", RC300: "Lexus", IS200: "Lexus", IS250: "Lexus", IS300: "Lexus", GS300: "Lexus",
  // Maserati
  QUATTROPORTE: "Maserati", GHIBLI: "Maserati", GRANTURISMO: "Maserati",
  // Skoda
  SUPERB: "Skoda", OCTAVIA: "Skoda", OCT: "Skoda", FABIA: "Skoda", KODIAQ: "Skoda",
  // Citroen
  DS3: "Citroen",
  // Ford
  FIESTA: "Ford", FOCUS: "Ford", MUSTANG: "Ford",
};

// Tokens that are noise, never part of a model name we want to show
const MODEL_NOISE = new Set([
  "TRUE", "REAR", "FRONT", "COILOVER", "COILOVERS", "CAM", "CAS", "CAM/CAS", "CENTRAL",
  "INV", "INVERTED", "FORK", "CROSS", "STRUT", "BRACE", "TMS", "TM", "FWD", "AWD", "RWD",
  "4WD", "2WD", "WITH", "AND", "OE", "PARTS", "MUST", "USE", "SOME", "KIT", "ONLY",
  "45MM", "47MM", "51MM", "BC", "SPORT", "F&R", "R&F",
]);

function detectMake(tokens: string[]): { make: string; makeToken: string } {
  for (const tok of tokens) {
    const up = tok.toUpperCase().replace(/[^A-Z0-9\-/]/g, "");
    // Match the whole token, then its slash-separated parts (e.g. "Honda/Acura")
    const candidates = [up, ...up.split("/")];
    for (const c of candidates) {
      if (!c) continue;
      if (MAKE_ALIASES[c]) return { make: MAKE_ALIASES[c], makeToken: up };
      if (MODEL_TO_MAKE[c]) return { make: MODEL_TO_MAKE[c], makeToken: up };
    }
  }
  return { make: "Other", makeToken: "" };
}

type ParsedProduct = {
  brand: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  yearLabel: string;
  series: string;
};

function parseTitle(title: string): ParsedProduct {
  let carPart: string;
  let series = "";

  if (/^BC[-\s]Racing\s+\w+\s+Series/i.test(title)) {
    // New format: "BC Racing BR Series, NISSAN SILVIA S13 89-94 6/4kg.mm, Coilovers (SKU)"
    const sm = title.match(/^BC[-\s]Racing\s+(\w+)\s+Series/i);
    series = sm?.[1]?.toUpperCase() || "";
    const commaIdx = title.indexOf(",");
    carPart = commaIdx >= 0 ? title.slice(commaIdx + 1) : title;
    // Strip spring-rate onward: e.g. "6/4kg.mm ...", "8/5KG.MM ..."
    carPart = carPart.replace(/\s*\d+\.?\d*\/\d+\.?\d*\s*(?:kg\.?mm|mm\.?kg).*$/gi, "");
    // Strip ", Coilovers..." suffix
    carPart = carPart.replace(/\s*,\s*coilovers.*$/i, "");
    // Strip trailing SKU in parens: (D-12-ZR)
    carPart = carPart.replace(/\s*\([A-Z0-9\-]+\)\s*$/i, "");
    // Strip N-way descriptors: "3-way ZR"
    carPart = carPart.replace(/\s*\d+-way\s+\w+\s*/gi, " ");
    carPart = carPart.trim();
  } else {
    // Old format: "[Car info] BC Racing Coilover Kit [Series]"
    const kitIdx = title.search(/\s+BC[-\s]Racing\s+Coilover\s+Kit/i);
    carPart = kitIdx >= 0 ? title.slice(0, kitIdx) : title;
    const sm = title.match(/Kit[-\s]+(\S+)$/i);
    series = sm?.[1]?.toUpperCase() || "";
  }

  const toFull = (y: string) => {
    const n = parseInt(y);
    if (y.length === 4) return n;
    return n < 30 ? 2000 + n : 1900 + n;
  };

  let yearStart = 0, yearEnd = 0;
  const yearRangeMatch = carPart.match(/(\d{2,4})[-–](\d{2,4})/);
  const yearPlusMatch = carPart.match(/(\d{2,4})\+/);

  if (yearRangeMatch) {
    yearStart = toFull(yearRangeMatch[1]);
    yearEnd = toFull(yearRangeMatch[2]);
    if (yearEnd < yearStart) yearEnd += Math.floor(yearStart / 100) * 100;
  } else if (yearPlusMatch) {
    yearStart = toFull(yearPlusMatch[1]);
    yearEnd = new Date().getFullYear() + 2;
  }

  const yearLabel = yearStart
    ? yearEnd >= new Date().getFullYear() ? `${yearStart}+` : `${yearStart}–${yearEnd}`
    : "";

  const withoutYear = carPart
    .replace(/\s*\(\d{2,4}[-–]\d{2,4}\)\s*/g, " ")
    .replace(/\s*(\d{2,4})[-–](\d{2,4})\s*/g, " ")
    .replace(/\s*(\d{2,4})\+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = withoutYear.split(/[\s,]+/).filter(Boolean);
  const { make, makeToken } = detectMake(tokens);
  const brand = make;

  // Model: remaining tokens after removing the matched make token and noise.
  let makeStripped = false;
  const modelTokens = tokens.filter((tok) => {
    const up = tok.toUpperCase().replace(/[^A-Z0-9\-/]/g, "");
    if (!makeStripped && up === makeToken) { makeStripped = true; return false; }
    if (MODEL_NOISE.has(up)) return false;
    if (MAKE_ALIASES[up]) return false;
    return true;
  });
  const model = modelTokens.join(" ").trim() || (brand !== "Other" ? brand : withoutYear);

  return { brand, model, yearStart, yearEnd, yearLabel, series };
}

function CascadeSelect({
  label, value, options, onChange, disabled, placeholder, step,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
  disabled?: boolean; placeholder: string; step: 1 | 2 | 3;
}) {
  const stepColor = disabled ? "text-white/20" : "text-primary";
  return (
    <div className={`flex-1 ${disabled ? "opacity-40" : ""} transition-opacity`} data-testid={`cascade-step-${step}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`font-tech text-[10px] font-bold uppercase tracking-[0.25em] ${stepColor}`}>
          {step}.
        </span>
        <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-white/50">{label}</span>
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none bg-white/5 border border-white/10 text-white font-tech text-sm px-4 pr-10 py-3 focus:outline-none focus:border-primary/60 disabled:cursor-not-allowed transition-colors"
          data-testid={`select-cascade-${step}`}
        >
          <option value="" className="bg-black">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-black">{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
      </div>
    </div>
  );
}

export default function BcRacingPage() {
  const { t, lang } = useLanguage();
  const [selBrand, setSelBrand] = useState("");
  const [selYear, setSelYear] = useState("");
  const [selModel, setSelModel] = useState("");

  const { data: allProducts, isLoading, error } = useQuery<Product[]>({
    queryKey: ["collection-all", BC_RACING_HANDLE],
    queryFn: () => getAllCollectionProducts(BC_RACING_HANDLE),
    staleTime: 60 * 60 * 1000,
  });

  const parsed = useMemo(
    () => (allProducts || []).map((p) => ({ product: p, ...parseTitle(p.title) })),
    [allProducts]
  );

  // Step 1: all brands A-Z
  const brands = useMemo(() => {
    const set = new Set(parsed.map((p) => p.brand));
    return Array.from(set).sort();
  }, [parsed]);

  const CURRENT_YEAR = new Date().getFullYear();

  // Step 2: expand each product's year range into individual years for the dropdown
  const years = useMemo(() => {
    if (!selBrand) return [];
    const set = new Set<number>();
    parsed
      .filter((p) => p.brand === selBrand && p.yearStart > 0)
      .forEach((p) => {
        const end = Math.min(p.yearEnd || p.yearStart, CURRENT_YEAR);
        for (let y = p.yearStart; y <= end; y++) set.add(y);
      });
    return Array.from(set).sort((a, b) => a - b).map(String);
  }, [parsed, selBrand]);

  // Step 3: models whose year range covers the selected individual year
  const models = useMemo(() => {
    if (!selBrand || !selYear) return [];
    const y = parseInt(selYear);
    const set = new Set(
      parsed
        .filter((p) => {
          if (p.brand !== selBrand || !p.yearStart) return false;
          const end = p.yearEnd || p.yearStart;
          return p.yearStart <= y && end >= y;
        })
        .map((p) => p.model)
    );
    return Array.from(set).sort();
  }, [parsed, selBrand, selYear]);

  const hasSelection = !!selBrand;

  function reset() {
    setSelBrand(""); setSelYear(""); setSelModel("");
  }
  function onBrandChange(v: string) {
    setSelBrand(v); setSelYear(""); setSelModel("");
  }
  function onYearChange(v: string) {
    setSelYear(v); setSelModel("");
  }

  const seoTitles: Record<string, string> = {
    en: "BC Racing Coilovers — Official NL Dealer | Juju Wheels",
    nl: "BC Racing Coilovers — Officieel NL Dealer | Juju Wheels",
    de: "BC Racing Gewindefahrwerke — Offizieller NL Händler | Juju Wheels",
    es: "BC Racing Coilovers — Distribuidor Oficial NL | Juju Wheels",
    fr: "BC Racing Combinés Filetés — Distributeur Officiel NL | Juju Wheels",
  };
  const seoDescs: Record<string, string> = {
    en: "Official BC Racing coilover dealer in the Netherlands. Fully adjustable with custom spring rates. Fast EU shipping and expert fitment advice included.",
    nl: "Officieel BC Racing coilover dealer in Nederland. Volledig verstelbaar met aangepaste veerrates. Snelle EU-verzending en gratis fitment advies inbegrepen.",
    de: "Offizieller BC Racing Händler in den Niederlanden. Vollständig einstellbare Fahrwerke, individuelle Federraten, schneller EU-Versand und Expertenberatung.",
    es: "Distribuidor oficial de BC Racing en Países Bajos. Coilovers totalmente ajustables con tasas de resorte personalizadas. Envío rápido por Europa incluido.",
    fr: "Distributeur officiel BC Racing aux Pays-Bas. Combinés filetés entièrement réglables, taux de ressorts sur mesure, livraison rapide en Europe incluse.",
  };

  const BASE_URL = "https://jujuwheels.com";
  const itemListItems = (allProducts || []).map((p) => ({
    name: p.title,
    url: `${BASE_URL}/products/${p.handle}`,
  }));

  const bcRacingBrandJsonLd = {
    name: "BC Racing",
    url: `${BASE_URL}/bc-racing`,
    description: "BC Racing produces fully adjustable coilover suspension kits with custom spring rates, used worldwide in motorsport and street performance applications.",
  };

  const INFO_CARDS = [
    { icon: ShieldCheck, title: t('bcracing.card2Title') || 'Save Your Serial Number', desc: t('bcracing.card2Desc') || 'The serial number on your warranty card is essential for warranty claims. Keep it safe.', testId: 'card-bcracing-serial' },
    { icon: Zap, title: t('bcracing.card3Title') || 'Custom Spring Rates', desc: t('bcracing.card3Desc') || 'Extra-low options and custom spring rates available on request.', testId: 'card-bcracing-custom' },
    { icon: Clock, title: t('bcracing.card4Title') || 'Lead Time', desc: t('bcracing.card4Desc') || 'Custom kits take 3–4 weeks. Stock kits typically ship faster.', testId: 'card-bcracing-leadtime' },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title={seoTitles[lang] ?? seoTitles.en}
        description={seoDescs[lang] ?? seoDescs.en}
        itemListJsonLd={itemListItems.length > 0 ? { items: itemListItems } : undefined}
        brandJsonLd={bcRacingBrandJsonLd}
      />

      {/* Hero */}
      <section className="pt-28 pb-20 relative overflow-hidden border-b border-white/10" data-testid="section-bcracing-hero">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `linear-gradient(rgba(233,211,85,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(233,211,85,0.5) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6">
                <div className="mb-4">
                  <img src="/bc-racing-logo.png" alt="BC Racing" className="h-14 md:h-20 w-auto"
                    onError={(e) => { const el = e.currentTarget; el.style.display = 'none'; const b = document.createElement('span'); b.className = 'font-display font-bold text-white text-3xl uppercase tracking-wider'; b.textContent = 'BC Racing'; el.parentNode?.insertBefore(b, el.nextSibling); }}
                    data-testid="img-bcracing-logo" />
                </div>
                <span className="border border-primary/40 text-primary font-tech uppercase tracking-[0.3em] text-[10px] px-3 py-1.5">
                  {t('bcracing.officialDealerBadge') || 'Official Dealer'}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white uppercase leading-none mb-5" data-testid="text-bcracing-hero-title">
                {t('bcracing.heroTitle') || 'BC Racing Coilovers'}<br />
                <span className="text-primary">{t('bcracing.heroTitleAccent') || 'Built Different'}</span>
              </h1>
              <p className="text-white/60 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
                {t('bcracing.heroDesc') || 'BC Racing coilovers — fully adjustable, competition-proven, and available in custom spring rates. Official dealer in the Netherlands.'}
              </p>
              <div className="block lg:hidden relative mb-8">
                <FitmentImage src="/bc-racing/hero.jpg" alt="BC Racing coilovers" fallbackLabel="BC Racing Hero Image" className="max-h-72 w-full object-cover" testId="img-bcracing-hero-mobile" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent" />
              </div>
              <div className="flex flex-wrap gap-4">
                <a href="#find-kit" data-testid="button-bcracing-findkit">
                  <Button size="lg" className="bg-primary text-black hover:bg-white hover:text-black font-tech uppercase tracking-widest text-sm h-14 px-10 rounded-none">
                    Find Your Kit <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </a>
                <a href="https://wa.me/31611601627?text=Hi%2C%20I%20have%20a%20question%20about%20BC%20Racing%20coilovers" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-14 px-8 border border-white/20 text-white font-tech uppercase tracking-widest text-sm hover:border-primary hover:text-primary transition-colors"
                  data-testid="link-bcracing-whatsapp-hero">
                  <MessageCircle className="w-4 h-4" /> Ask via WhatsApp
                </a>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <FitmentImage src="/bc-racing/hero.jpg" alt="BC Racing coilovers" fallbackLabel="BC Racing Hero Image" className="max-h-[560px] w-full object-cover" testId="img-bcracing-hero" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="border-b border-white/10" data-testid="section-bcracing-info">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-white/10">
            {INFO_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={card.testId} className={`p-8 ${i < INFO_CARDS.length - 1 ? "border-b sm:border-b-0 sm:border-r border-white/10" : ""}`} data-testid={card.testId}>
                  <div className="w-10 h-10 border border-primary/30 bg-primary/5 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-display font-bold text-white uppercase mb-2">{card.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Find Your Kit */}
      <section id="find-kit" className="py-20 border-b border-white/10" data-testid="section-bcracing-findkit">
        <div className="container mx-auto px-4 max-w-3xl">

          <div className="mb-10">
            <span className="text-primary font-tech uppercase tracking-[0.3em] text-xs mb-3 block">
              Free fitment advice
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase mb-4">
              Find Your Kit
            </h2>
            <p className="text-white/50 text-base leading-relaxed">
              Select your car below. We'll come back to you with the exact kit, spring rates, and pricing — no guesswork.
            </p>
          </div>

          {/* Cascading selectors */}
          {isLoading ? (
            <div className="flex items-center gap-3 py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-tech text-sm text-white/40 uppercase tracking-wider">Loading catalogue…</span>
            </div>
          ) : (
            <div className="border border-white/10 p-6 bg-white/[0.02] mb-8" data-testid="vehicle-selector">
              <div className="flex flex-col sm:flex-row gap-4">
                <CascadeSelect
                  step={1}
                  label="Brand"
                  value={selBrand}
                  options={brands}
                  onChange={onBrandChange}
                  placeholder="Select brand"
                />
                <CascadeSelect
                  step={2}
                  label="Year"
                  value={selYear}
                  options={years}
                  onChange={onYearChange}
                  disabled={!selBrand}
                  placeholder={selBrand ? "Select year" : "Select brand first"}
                />
                <CascadeSelect
                  step={3}
                  label="Model"
                  value={selModel}
                  options={models}
                  onChange={setSelModel}
                  disabled={!selYear}
                  placeholder={selYear ? "Select model" : "Select year first"}
                />
                {hasSelection && (
                  <div className="flex items-end">
                    <button
                      onClick={reset}
                      className="flex items-center gap-2 h-[46px] px-4 border border-white/10 text-white/40 hover:text-white hover:border-white/30 font-tech text-xs uppercase tracking-wider transition-colors whitespace-nowrap"
                      data-testid="button-bcracing-reset"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact CTA — adapts to selection state */}
          {!isLoading && (() => {
            const carLabel = [selBrand, selYear, selModel].filter(Boolean).join(" ");
            const waText = carLabel
              ? `Hi%2C%20I%27m%20looking%20for%20a%20BC%20Racing%20coilover%20kit%20for%20my%20${encodeURIComponent(carLabel)}.%20Can%20you%20advise%20on%20the%20right%20spec%3F`
              : `Hi%2C%20I%20have%20a%20question%20about%20BC%20Racing%20coilovers.`;
            const emailSubject = carLabel
              ? `BC%20Racing%20Kit%20for%20${encodeURIComponent(carLabel)}`
              : `BC%20Racing%20Coilover%20Advice`;

            return (
              <div className="border border-white/10 bg-white/[0.02]" data-testid="contact-cta">
                <div className="p-6 border-b border-white/10">
                  {selModel ? (
                    <>
                      <p className="font-display font-bold text-white uppercase text-lg mb-1">
                        Ready to order your {selBrand} {selYear} {selModel} kit?
                      </p>
                      <p className="text-white/40 font-tech text-xs uppercase tracking-wider">
                        Reach out and we'll confirm fitment, spring rates, and get it ordered.
                      </p>
                    </>
                  ) : selBrand ? (
                    <>
                      <p className="font-display font-bold text-white uppercase text-lg mb-1">
                        Tell us more about your {selBrand}
                      </p>
                      <p className="text-white/40 font-tech text-xs uppercase tracking-wider">
                        Complete the selectors above or reach out and we'll help directly.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-display font-bold text-white uppercase text-lg mb-1">
                        Not sure what to pick?
                      </p>
                      <p className="text-white/40 font-tech text-xs uppercase tracking-wider">
                        Select your car above or reach out and we'll guide you from scratch.
                      </p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                  <a
                    href={`https://wa.me/31611601627?text=${waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-6 hover:bg-primary/5 transition-colors"
                    data-testid="link-cta-whatsapp"
                  >
                    <div className="w-10 h-10 shrink-0 border border-primary/40 bg-primary/8 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/15 transition-colors">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-white uppercase text-sm leading-tight">WhatsApp</p>
                      <p className="text-primary/60 font-tech text-[10px] uppercase tracking-wider mt-0.5">Fastest reply</p>
                    </div>
                  </a>

                  <a
                    href="tel:+31611601627"
                    className="group flex items-center gap-4 p-6 hover:bg-white/[0.03] transition-colors"
                    data-testid="link-cta-call"
                  >
                    <div className="w-10 h-10 shrink-0 border border-white/15 bg-white/[0.03] flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                      <Phone className="w-5 h-5 text-white/50 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-white uppercase text-sm leading-tight">Call Us</p>
                      <p className="text-white/30 font-tech text-[10px] uppercase tracking-wider mt-0.5">+31 6 11 60 16 27</p>
                    </div>
                  </a>

                  <a
                    href={`mailto:jvlecom@outlook.com?subject=${emailSubject}`}
                    className="group flex items-center gap-4 p-6 hover:bg-white/[0.03] transition-colors"
                    data-testid="link-cta-email"
                  >
                    <div className="w-10 h-10 shrink-0 border border-white/15 bg-white/[0.03] flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                      <Mail className="w-5 h-5 text-white/50 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-white uppercase text-sm leading-tight">Email Us</p>
                      <p className="text-white/30 font-tech text-[10px] uppercase tracking-wider mt-0.5">jvlecom@outlook.com</p>
                    </div>
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
