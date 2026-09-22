import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { RotateCcw, Save, Trash2, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/language";
import type { SavedSpec } from "@shared/schema";

type MountingStyle = "sandwich" | "front" | "rear";

interface WheelSpecs {
  name: string;
  diameter: number;
  totalWidth: number;
  currentET: number;
  mountingStyle: MountingStyle;
  innerBarrel: number;
  outerLip: number;
}

interface WideningInput {
  addOuterLip: number;
  addInnerBarrel: number;
}

const FLANGE_THICKNESS = 0.5;

function calculateNewSpecs(specs: WheelSpecs, widening: WideningInput) {
  const newInnerBarrel = specs.innerBarrel + widening.addInnerBarrel;
  const newOuterLip = specs.outerLip + widening.addOuterLip;
  const baseWidth = newInnerBarrel + newOuterLip;
  const newWidth = specs.mountingStyle === "sandwich" ? baseWidth + FLANGE_THICKNESS : baseWidth;

  const totalAdded = widening.addOuterLip + widening.addInnerBarrel;
  const totalAddedMm = totalAdded * 25.4;

  let etShift = 0;
  if (specs.mountingStyle === "sandwich") {
    const outerGrowthMm = widening.addOuterLip * 25.4;
    etShift = (totalAddedMm / 2) - outerGrowthMm;
  } else if (specs.mountingStyle === "front") {
    etShift = -(widening.addOuterLip * 25.4);
  } else {
    etShift = widening.addInnerBarrel * 25.4;
  }

  const newET = Math.round(specs.currentET + etShift);

  return {
    newWidth,
    newET,
    newInnerBarrel,
    newOuterLip,
    baseWidth,
    diameter: specs.diameter,
    mountingStyle: specs.mountingStyle,
  };
}

const defaultSpecs: WheelSpecs = {
  name: "",
  diameter: 18,
  totalWidth: 9,
  currentET: 35,
  mountingStyle: "sandwich",
  innerBarrel: 6.5,
  outerLip: 2,
};

const defaultWidening: WideningInput = {
  addOuterLip: 0.5,
  addInnerBarrel: 0,
};

function NumberInput({ label, value, onChange, suffix, step = 0.5, min, max }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-tech uppercase tracking-wider text-white/50 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          min={min}
          max={max}
          className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 text-sm font-tech focus:outline-none focus:border-primary/50 transition-colors"
          data-testid={`input-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs font-tech">{suffix}</span>}
      </div>
    </div>
  );
}

function WheelDiagram({ specs, widening, result }: {
  specs: WheelSpecs;
  widening: WideningInput;
  result: ReturnType<typeof calculateNewSpecs>;
}) {
  const svgWidth = 400;
  const svgHeight = 280;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  const totalWidthPx = 200;
  const hubLine = centerX;

  const outerLipRatio = result.newOuterLip / result.newWidth;
  const innerBarrelRatio = result.newInnerBarrel / result.newWidth;
  const flangeRatio = FLANGE_THICKNESS / result.newWidth;

  const outerLipPx = totalWidthPx * outerLipRatio;
  const innerBarrelPx = totalWidthPx * innerBarrelRatio;
  const flangePx = totalWidthPx * flangeRatio;

  const wheelLeft = centerX - totalWidthPx / 2;
  const wheelRight = centerX + totalWidthPx / 2;
  const wheelTop = centerY - 80;
  const wheelBottom = centerY + 80;

  const mountX = wheelLeft + outerLipPx + flangePx / 2;

  const addedOuterPx = widening.addOuterLip > 0 ? totalWidthPx * (widening.addOuterLip / result.newWidth) : 0;
  const addedInnerPx = widening.addInnerBarrel > 0 ? totalWidthPx * (widening.addInnerBarrel / result.newWidth) : 0;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-md mx-auto" data-testid="svg-wheel-diagram">
      <rect x={wheelLeft} y={wheelTop} width={outerLipPx} height={wheelBottom - wheelTop} fill="#E9D355" opacity="0.15" stroke="#E9D355" strokeWidth="1" />
      {addedOuterPx > 0 && (
        <rect x={wheelLeft} y={wheelTop} width={addedOuterPx} height={wheelBottom - wheelTop} fill="#E9D355" opacity="0.3" stroke="#E9D355" strokeWidth="1" strokeDasharray="4 2" />
      )}

      <rect x={wheelLeft + outerLipPx} y={wheelTop} width={flangePx} height={wheelBottom - wheelTop} fill="white" opacity="0.15" stroke="white" strokeWidth="1" />

      <rect x={wheelLeft + outerLipPx + flangePx} y={wheelTop} width={innerBarrelPx} height={wheelBottom - wheelTop} fill="#4488ff" opacity="0.15" stroke="#4488ff" strokeWidth="1" />
      {addedInnerPx > 0 && (
        <rect x={wheelRight - addedInnerPx} y={wheelTop} width={addedInnerPx} height={wheelBottom - wheelTop} fill="#4488ff" opacity="0.3" stroke="#4488ff" strokeWidth="1" strokeDasharray="4 2" />
      )}

      <line x1={mountX} y1={wheelTop - 15} x2={mountX} y2={wheelBottom + 15} stroke="#E9D355" strokeWidth="1.5" strokeDasharray="6 3" />
      <text x={mountX} y={wheelTop - 20} fill="#E9D355" fontSize="9" textAnchor="middle" fontFamily="monospace">MOUNTING</text>

      <line x1={hubLine} y1={wheelTop - 5} x2={hubLine} y2={wheelBottom + 5} stroke="white" strokeWidth="0.5" opacity="0.3" />
      <text x={hubLine} y={wheelBottom + 22} fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace" opacity="0.4">CENTER</text>

      <text x={wheelLeft + outerLipPx / 2} y={centerY + 4} fill="#E9D355" fontSize="10" textAnchor="middle" fontFamily="monospace">{result.newOuterLip}J</text>
      <text x={wheelLeft + outerLipPx / 2} y={centerY + 16} fill="#E9D355" fontSize="8" textAnchor="middle" fontFamily="monospace" opacity="0.6">LIP</text>

      <text x={wheelLeft + outerLipPx + flangePx + innerBarrelPx / 2} y={centerY + 4} fill="#4488ff" fontSize="10" textAnchor="middle" fontFamily="monospace">{result.newInnerBarrel}J</text>
      <text x={wheelLeft + outerLipPx + flangePx + innerBarrelPx / 2} y={centerY + 16} fill="#4488ff" fontSize="8" textAnchor="middle" fontFamily="monospace" opacity="0.6">BARREL</text>

      <line x1={wheelLeft} y1={wheelBottom + 35} x2={wheelRight} y2={wheelBottom + 35} stroke="white" strokeWidth="1" />
      <line x1={wheelLeft} y1={wheelBottom + 30} x2={wheelLeft} y2={wheelBottom + 40} stroke="white" strokeWidth="1" />
      <line x1={wheelRight} y1={wheelBottom + 30} x2={wheelRight} y2={wheelBottom + 40} stroke="white" strokeWidth="1" />
      <text x={centerX} y={wheelBottom + 50} fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace">{result.newWidth}J TOTAL</text>

      <text x={wheelLeft - 5} y={centerY} fill="white" fontSize="9" textAnchor="end" fontFamily="monospace" opacity="0.5">OUTSIDE</text>
      <text x={wheelRight + 5} y={centerY} fill="white" fontSize="9" textAnchor="start" fontFamily="monospace" opacity="0.5">INSIDE</text>
    </svg>
  );
}

export default function WheelSpecCalculator() {
  const { t } = useLanguage();
  const { user, isAuthenticated, profileComplete, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [specs, setSpecs] = useState<WheelSpecs>(defaultSpecs);
  const [widening, setWidening] = useState<WideningInput>(defaultWidening);

  const { data: savedSpecs = [], isLoading: specsLoading } = useQuery<SavedSpec[]>({
    queryKey: ["/api/saved-specs"],
    queryFn: async () => {
      const res = await fetch("/api/saved-specs", { credentials: "include" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Failed to fetch saved specs");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/saved-specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save spec");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-specs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/saved-specs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete spec");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-specs"] });
    },
  });

  const result = calculateNewSpecs(specs, widening);

  const handleReset = useCallback(() => {
    setSpecs(defaultSpecs);
    setWidening(defaultWidening);
  }, []);

  const handleSave = useCallback(() => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    const name = specs.name || `${specs.diameter}" ${specs.totalWidth}J ET${specs.currentET}`;
    saveMutation.mutate({
      name,
      diameter: specs.diameter,
      totalWidth: specs.totalWidth,
      currentET: specs.currentET,
      mountingStyle: specs.mountingStyle,
      innerBarrel: specs.innerBarrel,
      outerLip: specs.outerLip,
      addOuterLip: widening.addOuterLip,
      addInnerBarrel: widening.addInnerBarrel,
    });
  }, [specs, widening, isAuthenticated, saveMutation]);

  const handleDeleteSpec = useCallback((id: number) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleLoadSpec = useCallback((entry: SavedSpec) => {
    setSpecs({
      name: entry.name,
      diameter: entry.diameter,
      totalWidth: entry.totalWidth,
      currentET: entry.currentET,
      mountingStyle: entry.mountingStyle as MountingStyle,
      innerBarrel: entry.innerBarrel,
      outerLip: entry.outerLip,
    });
    setWidening({
      addOuterLip: entry.addOuterLip,
      addInnerBarrel: entry.addInnerBarrel,
    });
  }, []);

  const updateSpecs = (key: keyof WheelSpecs, value: any) => setSpecs((s) => ({ ...s, [key]: value }));
  const updateWidening = (key: keyof WideningInput, value: number) => setWidening((w) => ({ ...w, [key]: value }));

  const mountingStyleLabels: Record<MountingStyle, string> = {
    sandwich: t('spec.sandwich'),
    front: t('spec.front'),
    rear: t('spec.rear'),
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <SEO
        title="3-Piece Wheel Spec Calculator | Width & Offset Builder"
        description="Calculate barrel widths and offset changes for 3-piece JDM wheels. Enter your current specs and see exactly how width and offset shift with different lip sizes."
      />
      <div className="container mx-auto px-4">
        <div className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 uppercase" data-testid="text-spec-calc-title">
            {t('spec.title')}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {t('spec.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-lg font-display text-white uppercase tracking-wider mb-1" data-testid="text-current-specs">{t('spec.currentSpecs')}</h2>
              <p className="text-xs text-white/40 mb-6">{t('spec.currentSpecsDesc')}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-tech uppercase tracking-wider text-white/50 mb-1.5">{t('spec.referenceName')}</label>
                  <input
                    type="text"
                    value={specs.name}
                    onChange={(e) => updateSpecs("name", e.target.value)}
                    placeholder="e.g. Work Meister S1 3P"
                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 text-sm font-tech focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20"
                    data-testid="input-reference-name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label={t('spec.diameterInch')} value={specs.diameter} onChange={(v) => updateSpecs("diameter", v)} suffix={'"'} step={1} min={13} max={22} />
                  <NumberInput label={t('spec.totalWidthJ')} value={specs.totalWidth} onChange={(v) => updateSpecs("totalWidth", v)} suffix="J" step={0.5} min={4} max={15} />
                </div>

                <NumberInput label={t('spec.currentETmm')} value={specs.currentET} onChange={(v) => updateSpecs("currentET", v)} suffix="mm" step={1} min={-30} max={60} />

                <div>
                  <label className="block text-xs font-tech uppercase tracking-wider text-white/50 mb-1.5">{t('spec.mountingStyle')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["sandwich", "front", "rear"] as MountingStyle[]).map((style) => (
                      <button
                        key={style}
                        onClick={() => updateSpecs("mountingStyle", style)}
                        className={`py-2.5 px-3 text-xs font-tech uppercase tracking-wider border transition-colors ${
                          specs.mountingStyle === style
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-white/10 text-white/50 hover:border-white/30"
                        }`}
                        data-testid={`button-mounting-${style}`}
                      >
                        {mountingStyleLabels[style]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label={t('spec.innerBarrelJ')} value={specs.innerBarrel} onChange={(v) => updateSpecs("innerBarrel", v)} suffix="J" step={0.5} min={0} max={12} />
                  <NumberInput label={t('spec.outerLipJ')} value={specs.outerLip} onChange={(v) => updateSpecs("outerLip", v)} suffix="J" step={0.5} min={0} max={8} />
                </div>
              </div>
            </div>

            <div className="border border-primary/20 bg-primary/[0.03] p-6">
              <h2 className="text-lg font-display text-primary uppercase tracking-wider mb-1" data-testid="text-widening">{t('spec.plannedWidening')}</h2>
              <p className="text-xs text-white/40 mb-6">{t('spec.plannedWideningDesc')}</p>

              <div className="grid grid-cols-2 gap-4">
                <NumberInput label={t('spec.addOuterLipJ')} value={widening.addOuterLip} onChange={(v) => updateWidening("addOuterLip", v)} suffix="J" step={0.5} min={0} max={5} />
                <NumberInput label={t('spec.addInnerBarrelJ')} value={widening.addInnerBarrel} onChange={(v) => updateWidening("addInnerBarrel", v)} suffix="J" step={0.5} min={0} max={5} />
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={handleReset} variant="outline" className="flex-1 border-white/10 text-white/60 hover:bg-white/5 rounded-none font-tech uppercase tracking-wider text-xs h-11" data-testid="button-reset">
                  <RotateCcw className="w-3.5 h-3.5 mr-2" /> {t('spec.reset')}
                </Button>
                {isAuthenticated && profileComplete ? (
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="flex-1 bg-primary text-black hover:bg-primary/80 rounded-none font-tech uppercase tracking-wider text-xs h-11"
                    data-testid="button-save"
                  >
                    <Save className="w-3.5 h-3.5 mr-2" /> {saveMutation.isPending ? t('spec.saving') : t('spec.saveSpec')}
                  </Button>
                ) : (
                  <Button
                    onClick={() => { window.location.href = "/login"; }}
                    className="flex-1 bg-primary text-black hover:bg-primary/80 rounded-none font-tech uppercase tracking-wider text-xs h-11"
                    data-testid="button-login-to-save"
                  >
                    <LogIn className="w-3.5 h-3.5 mr-2" /> {t('spec.signUpToSave')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="border border-white/10 bg-white/[0.02] p-6">
              <WheelDiagram specs={specs} widening={widening} result={result} />
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-lg font-display text-white uppercase tracking-wider mb-1" data-testid="text-new-specs">{t('spec.newSpecs')}</h2>
              <p className="text-xs text-white/40 mb-6">{t('spec.newSpecsDesc')}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 p-4">
                  <div className="text-xs font-tech uppercase tracking-wider text-white/40 mb-1">{t('spec.newWidth')}</div>
                  <div className="text-2xl font-display text-primary" data-testid="text-new-width">{result.newWidth}J</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4">
                  <div className="text-xs font-tech uppercase tracking-wider text-white/40 mb-1">{t('spec.newOffset')}</div>
                  <div className="text-2xl font-display text-primary" data-testid="text-new-offset">{result.newET > 0 ? "+" : ""}{result.newET}mm</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs font-tech uppercase tracking-wider text-white/50">{t('spec.diameter')}</span>
                  <span className="text-sm font-tech text-white">{result.diameter}"</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs font-tech uppercase tracking-wider text-white/50">{t('spec.mountingStyleLabel')}</span>
                  <span className="text-sm font-tech text-white capitalize">{result.mountingStyle}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs font-tech uppercase tracking-wider text-white/50">{t('spec.newInnerBarrel')}</span>
                  <span className="text-sm font-tech text-white">{result.newInnerBarrel} J</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs font-tech uppercase tracking-wider text-white/50">{t('spec.newOuterLip')}</span>
                  <span className="text-sm font-tech text-white">{result.newOuterLip} J</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs font-tech uppercase tracking-wider text-white/50">{t('spec.baseWidth')}</span>
                  <span className="text-sm font-tech text-white">{result.baseWidth} J</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs font-tech uppercase tracking-wider text-white/50">{t('spec.flangeThickness')}</span>
                  <span className="text-sm font-tech text-white">{FLANGE_THICKNESS} J</span>
                </div>
              </div>

              <div className="mt-6 p-3 bg-primary/5 border border-primary/20">
                <p className="text-xs text-primary/70 font-tech">{t('spec.verifyMeasurements')}</p>
              </div>
            </div>

            {isAuthenticated && profileComplete && savedSpecs.length > 0 && (
              <div className="border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-lg font-display text-white uppercase tracking-wider mb-4" data-testid="text-saved-specs">{t('spec.savedSpecs')}</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedSpecs.map((entry) => {
                    const entryResult = calculateNewSpecs({
                      name: entry.name,
                      diameter: entry.diameter,
                      totalWidth: entry.totalWidth,
                      currentET: entry.currentET,
                      mountingStyle: entry.mountingStyle as MountingStyle,
                      innerBarrel: entry.innerBarrel,
                      outerLip: entry.outerLip,
                    }, {
                      addOuterLip: entry.addOuterLip,
                      addInnerBarrel: entry.addInnerBarrel,
                    });
                    return (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 hover:border-white/20 transition-colors group">
                        <button onClick={() => handleLoadSpec(entry)} className="flex-1 text-left" data-testid={`button-load-spec-${entry.id}`}>
                          <div className="text-sm font-tech text-white">{entry.name}</div>
                          <div className="text-xs text-white/40 mt-0.5">
                            {entry.diameter}" {entry.totalWidth}J ET{entry.currentET} → {entryResult.newWidth}J ET{entryResult.newET}
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteSpec(entry.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          data-testid={`button-delete-spec-${entry.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(!isAuthenticated || !profileComplete) && !authLoading && (
              <div className="border border-white/10 bg-white/[0.02] p-6 text-center">
                <p className="text-sm text-white/50 mb-3 font-tech">{t('spec.signUpPrompt')}</p>
                <Button
                  onClick={() => { window.location.href = "/login"; }}
                  className="bg-primary text-black hover:bg-primary/80 rounded-none font-tech uppercase tracking-wider text-xs h-10"
                  data-testid="button-login-prompt"
                >
                  <LogIn className="w-3.5 h-3.5 mr-2" /> {t('spec.signUp')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
