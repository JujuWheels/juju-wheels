import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";
import { ArrowRight, Circle, Layers, ChevronDown } from "lucide-react";

type PartType = "outer-lip" | "inner-barrel" | null;
type LipProfile = "flat" | "step" | null;

const INCH_SIZES = ["15", "16", "17", "18", "19", "20"];
const J_SIZES = ["0.5J", "1.0J", "1.5J", "2.0J", "2.5J", "3.0J", "3.5J", "4.0J", "4.5J", "5.0J", "5.5J", "6.0J", "6.5J", "7.0J", "7.5J", "8.0J"];

const FLAT_SIZES = ["2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7"];
const STEP_SIZES = ["2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8"];

function jSizeToNumeric(jSize: string): string {
  const num = parseFloat(jSize.replace("J", ""));
  return num % 1 === 0 ? String(num) : num.toFixed(1);
}

function getPreviewImage(partType: PartType, lipProfile: LipProfile, jSize: string | null): string | null {
  if (!partType) return null;

  if (partType === "inner-barrel") {
    return `/images/parts/barrel.webp`;
  }

  if (partType === "outer-lip" && lipProfile && jSize) {
    const num = jSizeToNumeric(jSize);
    const sizes = lipProfile === "flat" ? FLAT_SIZES : STEP_SIZES;
    if (sizes.includes(num)) {
      return `/images/parts/${lipProfile}-${num}.webp`;
    }
    const closest = sizes.reduce((prev, curr) =>
      Math.abs(parseFloat(curr) - parseFloat(num)) < Math.abs(parseFloat(prev) - parseFloat(num)) ? curr : prev
    );
    return `/images/parts/${lipProfile}-${closest}.webp`;
  }

  if (partType === "outer-lip" && lipProfile) {
    return `/images/parts/${lipProfile}-4.webp`;
  }

  return null;
}

function buildProductHandle(partType: PartType, lipProfile: LipProfile, inchSize: string | null): string | null {
  if (!partType || !inchSize) return null;
  if (partType === "outer-lip") {
    const profile = lipProfile === "step" ? "Step" : "Flat";
    return `${inchSize}-inch-outer-lip-${profile.toLowerCase()}`;
  }
  if (partType === "inner-barrel") {
    const profile = lipProfile === "step" ? "step" : "flat";
    return `${inchSize}-inch-inner-barrel-${profile}`;
  }
  return null;
}

export default function PartsConfigurator() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [partType, setPartType] = useState<PartType>(null);
  const [lipProfile, setLipProfile] = useState<LipProfile>(null);
  const [inchSize, setInchSize] = useState<string | null>(null);
  const [jSize, setJSize] = useState<string | null>(null);
  const [wheelModel, setWheelModel] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const canProceed = partType && inchSize && jSize && lipProfile;

  const previewImage = useMemo(
    () => getPreviewImage(partType, lipProfile, jSize),
    [partType, lipProfile, jSize]
  );

  const handleFindPart = () => {
    if (!canProceed) return;
    const handle = buildProductHandle(partType, lipProfile, inchSize);
    if (handle) {
      navigate(`/products/${handle}?variant=${encodeURIComponent(jSize!)}&wheelModel=${encodeURIComponent(wheelModel)}`);
    }
  };

  const partTypes = [
    { key: "outer-lip" as PartType, label: t("configurator.outerLips"), icon: <Circle className="w-5 h-5" strokeWidth={1.5} /> },
    { key: "inner-barrel" as PartType, label: t("configurator.innerBarrels"), icon: <Layers className="w-5 h-5" strokeWidth={1.5} /> },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <SEO
        title="Parts Configurator — Outer Lips & Inner Barrels | Juju Wheels"
        description="Configure your 3-piece wheel build. Choose outer lips (0.5J–7.5J) or inner barrels for 15–20 inch wheels."
      />

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(233,211,85,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(233,211,85,0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 max-w-5xl">
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-4xl md:text-5xl font-display uppercase text-white mb-3 tracking-tight" data-testid="text-configurator-title">
            {t('configurator.title')}
          </h1>
          <p className="text-white/40 font-mono text-sm max-w-md mx-auto">
            {t('configurator.subtitle')}
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          <div className="space-y-6">

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 mb-3">
                {t('configurator.partType')}
              </label>
              <div className="grid grid-cols-2 gap-3" data-testid="selector-part-type">
                {partTypes.map((pt) => (
                  <button
                    key={pt.key}
                    onClick={() => setPartType(pt.key)}
                    className={`
                      flex flex-col items-center gap-2 py-4 px-3 border transition-all duration-300 text-center
                      ${partType === pt.key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/30 hover:text-white/80'}
                    `}
                    data-testid={`btn-part-${pt.key}`}
                  >
                    {pt.icon}
                    <span className="text-xs font-mono uppercase tracking-wider">{pt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {partType && (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 mb-3">
                  {t('configurator.lipProfile')}
                </label>
                <div className="grid grid-cols-2 gap-3" data-testid="selector-lip-profile">
                  {(["flat", "step"] as LipProfile[]).map((profile) => (
                    <button
                      key={profile}
                      onClick={() => setLipProfile(profile)}
                      className={`
                        py-3 px-4 border transition-all duration-300 text-center
                        ${lipProfile === profile
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/30 hover:text-white/80'}
                      `}
                      data-testid={`btn-profile-${profile}`}
                    >
                      <span className="text-sm font-mono uppercase tracking-wider">
                        {partType === "inner-barrel"
                          ? (profile === "flat" ? t('configurator.flatBarrel') : t('configurator.stepBarrel'))
                          : (profile === "flat" ? t('configurator.flatLip') : t('configurator.stepLip'))}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {partType && (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 mb-3">
                  {t('configurator.inchSize')}
                </label>
                <div className="grid grid-cols-6 gap-2" data-testid="selector-inch-size">
                  {INCH_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setInchSize(size)}
                      className={`
                        py-3 border transition-all duration-300 text-center
                        ${inchSize === size
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/30 hover:text-white/80'}
                      `}
                      data-testid={`btn-inch-${size}`}
                    >
                      <span className="text-sm font-display">{size}"</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {partType && (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 mb-3">
                  {t('configurator.jWidth')}
                </label>
                <div className="relative" data-testid="selector-j-size">
                  <select
                    value={jSize || ""}
                    onChange={(e) => setJSize(e.target.value || null)}
                    className="w-full appearance-none bg-white/[0.02] border border-white/10 text-white py-3 px-4 font-mono text-sm focus:border-primary focus:outline-none transition-colors cursor-pointer"
                    data-testid="select-j-size"
                  >
                    <option value="" className="bg-black">{t('configurator.selectJWidth')}</option>
                    {J_SIZES.map((size) => (
                      <option key={size} value={size} className="bg-black">{size}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 mb-3">
                {t('configurator.wheelModel')}
                <span className="text-white/30 ml-2 normal-case tracking-normal">({t('configurator.optional')})</span>
              </label>
              <input
                type="text"
                value={wheelModel}
                onChange={(e) => setWheelModel(e.target.value)}
                placeholder={t('configurator.wheelModelPlaceholder')}
                className="w-full bg-white/[0.02] border border-white/10 text-white py-3 px-4 font-mono text-sm placeholder:text-white/20 focus:border-primary focus:outline-none transition-colors"
                data-testid="input-wheel-model"
              />
              <p className="mt-2 text-[11px] text-white/30 leading-relaxed">
                {t('configurator.wheelModelExplainer')}
              </p>
            </div>

            <button
              onClick={handleFindPart}
              disabled={!canProceed}
              className={`
                w-full flex items-center justify-center gap-3 py-4 font-display uppercase text-lg tracking-wider transition-all duration-300
                ${canProceed
                  ? 'bg-primary text-black hover:bg-primary/90 cursor-pointer'
                  : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'}
              `}
              data-testid="btn-find-part"
            >
              {t('configurator.findPart')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-center order-first md:order-last" data-testid="preview-image-container">
            <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">

              {previewImage ? (
                <img
                  key={previewImage}
                  src={previewImage}
                  alt={
                    partType === "inner-barrel"
                      ? t("configurator.innerBarrels")
                      : `${lipProfile === "step" ? t("configurator.stepLip") : t("configurator.flatLip")}${jSize ? ` ${jSize}` : ""}`
                  }
                  width={400}
                  height={400}
                  className="w-full h-full object-contain p-6 animate-in fade-in duration-500 invert"
                  data-testid="img-part-preview"
                />
              ) : (
                <div className="text-center p-8">
                  <Circle className="w-12 h-12 text-white/10 mx-auto mb-4" strokeWidth={1} />
                  <p className="text-white/20 text-xs font-mono uppercase tracking-[0.2em]">
                    {t('configurator.selectToPreview')}
                  </p>
                </div>
              )}

              {lipProfile && partType && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                    {partType === "inner-barrel"
                      ? (lipProfile === "step" ? t("configurator.stepBarrel") : t("configurator.flatBarrel"))
                      : (lipProfile === "step" ? t("configurator.stepLip") : t("configurator.flatLip"))}
                  </span>
                  {jSize && <span className="text-sm font-display text-primary/80">{jSize}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`mt-12 text-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white/20 text-xs font-mono uppercase tracking-[0.2em]">
            {t('configurator.needHelp')}
          </p>
          <a
            href="https://wa.me/31611601627?text=I%20need%20help%20choosing%20wheel%20parts"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 text-primary/60 hover:text-primary text-xs font-mono uppercase tracking-wider transition-colors"
            data-testid="link-configurator-whatsapp"
          >
            {t('configurator.contactUs')}
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
