import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, ChevronDown, Search, Car, Info, CheckCircle, ArrowRight, Plus } from "lucide-react";

interface MakeItem {
  slug: string;
  name: string;
  name_en: string;
}

interface ModelItem {
  slug: string;
  name: string;
  name_en: string;
}

interface YearItem {
  slug: number;
  name: number;
}

interface ModificationItem {
  slug: string;
  name: string;
}

interface WheelFitment {
  front: FitmentSpec;
  rear: FitmentSpec | null;
}

interface FitmentSpec {
  rim: string;
  rim_diameter: number;
  rim_width: number;
  rim_offset: number;
  tire: string;
  tire_sizing_system: string;
  tire_construction: string;
  tire_width: number;
  tire_aspect_ratio: number;
  tire_diameter: number | null;
  tire_section_width: number | null;
  tire_is_82series: boolean;
}

interface TechnicalSpecs {
  stud_holes: number;
  pcd: number;
  centre_bore: string;
  bolt_pattern: string;
  wheel_fasteners?: { type: string; thread_size: string };
  wheel_tightening_torque?: string;
}

interface SearchResult {
  slug: string;
  name: string;
  body: string | null;
  trim: string;
  generation: { name: string; bodies: { slug: string; name: string; image: string | null }[] };
  engine: { fuel: string; capacity: string; type: string; power: { kW: number; PS: number; hp: number }; code: string };
  wheels: WheelFitment[];
  technical: TechnicalSpecs;
}

function VehicleFitment() {
  const { t } = useLanguage();

  const [makes, setMakes] = useState<MakeItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [years, setYears] = useState<YearItem[]>([]);
  const [modifications, setModifications] = useState<ModificationItem[]>([]);
  const [results, setResults] = useState<SearchResult[] | null>(null);

  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedModification, setSelectedModification] = useState("");

  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingMods, setLoadingMods] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [apiNotConfigured, setApiNotConfigured] = useState(false);

  useEffect(() => {
    setLoadingMakes(true);
    fetch("/api/wheel-size/makes")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.error?.includes("not configured")) {
            setApiNotConfigured(true);
          }
          throw new Error(data.error || "Failed to load makes");
        }
        return res.json();
      })
      .then((resp) => setMakes(Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []))
      .catch((err) => {
        console.error(err);
        if (err.message?.includes("not configured")) setApiNotConfigured(true);
      })
      .finally(() => setLoadingMakes(false));
  }, []);

  useEffect(() => {
    if (!selectedMake) { setModels([]); setSelectedModel(""); return; }
    setLoadingModels(true);
    setModels([]); setSelectedModel("");
    setYears([]); setSelectedYear("");
    setModifications([]); setSelectedModification("");
    setResults(null);
    fetch(`/api/wheel-size/models?make=${encodeURIComponent(selectedMake)}`)
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((resp) => setModels(Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []))
      .catch(console.error)
      .finally(() => setLoadingModels(false));
  }, [selectedMake]);

  useEffect(() => {
    if (!selectedMake || !selectedModel) { setYears([]); setSelectedYear(""); return; }
    setLoadingYears(true);
    setYears([]); setSelectedYear("");
    setModifications([]); setSelectedModification("");
    setResults(null);
    fetch(`/api/wheel-size/years?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}`)
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((resp) => setYears(Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []))
      .catch(console.error)
      .finally(() => setLoadingYears(false));
  }, [selectedMake, selectedModel]);

  useEffect(() => {
    if (!selectedMake || !selectedModel || !selectedYear) { setModifications([]); setSelectedModification(""); return; }
    setLoadingMods(true);
    setModifications([]); setSelectedModification("");
    fetch(`/api/wheel-size/modifications?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}&year=${encodeURIComponent(selectedYear)}`)
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((resp) => setModifications(Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []))
      .catch(console.error)
      .finally(() => setLoadingMods(false));
  }, [selectedMake, selectedModel, selectedYear]);

  const handleSearch = async () => {
    if (!selectedMake || !selectedModel || !selectedYear) return;
    setLoadingSearch(true);
    setError(null);
    setResults(null);
    try {
      const params = new URLSearchParams({
        make: selectedMake,
        model: selectedModel,
        year: selectedYear,
      });
      if (selectedModification) params.set("modification", selectedModification);
      const res = await fetch(`/api/wheel-size/search?${params}`);
      if (!res.ok) throw new Error("Failed to fetch fitment data");
      const resp = await res.json();
      const items = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
      setResults(items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  useEffect(() => {
    if (selectedMake && selectedModel && selectedYear) {
      handleSearch();
    }
  }, [selectedMake, selectedModel, selectedYear, selectedModification]);

  if (apiNotConfigured) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <Car className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-display uppercase text-white mb-4">{t('fitment.title')}</h1>
          <div className="border border-yellow-500/30 bg-yellow-500/5 p-8">
            <Info className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <p className="text-white/70 text-sm mb-2">{t('fitment.apiPending')}</p>
            <p className="text-white/40 text-xs">{t('fitment.apiPendingDesc')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28 pb-16">
      <SEO
        title="Vehicle Fitment Lookup | Find Wheels for Your Car"
        description="Look up PCD, bore size and factory wheel specs for your vehicle. Select your make, model, year and trim to find compatible JDM wheels at Juju Wheels."
      />
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-display uppercase tracking-tight text-white mb-3" data-testid="text-fitment-title">
            {t('fitment.title')}
          </h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto">
            {t('fitment.subtitle')}
          </p>
        </div>

        <div className="border border-white/10 bg-white/[0.02] p-6 mb-8" data-testid="section-vehicle-selector">
          <h3 className="font-tech uppercase tracking-wider text-sm text-white/60 mb-5 flex items-center gap-2">
            <Search className="w-4 h-4" />
            {t('fitment.selectVehicle')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SelectDropdown
              label={t('fitment.make')}
              value={selectedMake}
              onChange={setSelectedMake}
              options={makes.map((m) => ({ value: m.slug, label: m.name }))}
              loading={loadingMakes}
              placeholder={t('fitment.selectMake')}
              testId="select-make"
            />
            <SelectDropdown
              label={t('fitment.model')}
              value={selectedModel}
              onChange={setSelectedModel}
              options={models.map((m) => ({ value: m.slug, label: m.name }))}
              loading={loadingModels}
              disabled={!selectedMake}
              placeholder={t('fitment.selectModel')}
              testId="select-model"
            />
            <SelectDropdown
              label={t('fitment.year')}
              value={selectedYear}
              onChange={setSelectedYear}
              options={years.map((y) => ({ value: String(y.slug), label: String(y.name) }))}
              loading={loadingYears}
              disabled={!selectedModel}
              placeholder={t('fitment.selectYear')}
              testId="select-year"
            />
            <SelectDropdown
              label={t('fitment.modification')}
              value={selectedModification}
              onChange={setSelectedModification}
              options={modifications.map((m) => ({ value: m.slug, label: m.name }))}
              loading={loadingMods}
              disabled={!selectedYear}
              placeholder={t('fitment.allModifications')}
              testId="select-modification"
              optional
            />
          </div>
        </div>

        {loadingSearch && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {error && (
          <div className="border border-red-500/30 bg-red-500/5 p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {results && results.length === 0 && !loadingSearch && (
          <div className="text-center py-12 text-white/40">
            <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t('fitment.noResults')}</p>
          </div>
        )}

        {results && results.length > 0 && !loadingSearch && (
          <div className="space-y-6">
            {results.map((result, idx) => (
              <FitmentResultCard key={idx} result={result} index={idx} makeName={makes.find(m => m.slug === selectedMake)?.name || selectedMake} modelName={models.find(m => m.slug === selectedModel)?.name || selectedModel} year={selectedYear} />
            ))}

          </div>
        )}
      </div>
    </div>
  );
}

function SelectDropdown({
  label,
  value,
  onChange,
  options,
  loading,
  disabled,
  placeholder,
  testId,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  loading?: boolean;
  disabled?: boolean;
  placeholder: string;
  testId: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-white/40 font-tech uppercase tracking-wider mb-1.5">
        {label} {optional && <span className="text-white/20">({useLanguage().t('fitment.optional')})</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          className="w-full appearance-none bg-[#1a1a1a] border border-white/10 text-white text-sm px-3 py-2.5 pr-8 outline-none focus:border-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed [&>option]:bg-[#1a1a1a] [&>option]:text-white"
          data-testid={testId}
        >
          <option value="">{loading ? "..." : placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}

function FitmentResultCard({ result, index, makeName, modelName, year }: { result: SearchResult; index: number; makeName: string; modelName: string; year: string }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const genImage = result.generation?.bodies?.[0]?.image;

  const handleAddToGarage = async () => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    const parsedYear = parseInt(year);
    if (!makeName || !modelName || isNaN(parsedYear)) return;
    setSaving(true);
    try {
      const res = await fetch("/api/garage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          make: makeName,
          model: modelName,
          year: parsedYear,
          trim: result.trim || null,
          boltPattern: result.technical?.bolt_pattern || null,
          centreBore: result.technical?.centre_bore || null,
          imageUrl: genImage || null,
          wheels: result.wheels || null,
          specs: {
            generation: result.generation?.name || null,
            body: result.generation?.bodies?.[0]?.name || null,
            engine: result.engine || null,
            fasteners: result.technical?.wheel_fasteners || null,
            torque: result.technical?.wheel_tightening_torque || null,
          },
        }),
      });
      if (res.ok) setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-white/10 bg-white/[0.02] overflow-hidden" data-testid={`card-fitment-${index}`}>
      <div className="flex flex-col md:flex-row">
        {genImage && (
          <div className="md:w-64 flex-shrink-0 bg-white/5 flex items-center justify-center p-4">
            <img src={genImage} alt={result.trim} className="max-w-full max-h-40 object-contain" />
          </div>
        )}
        <div className="flex-1 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-display uppercase text-white" data-testid={`text-fitment-trim-${index}`}>
                {result.trim}
              </h3>
              <p className="text-white/40 text-xs font-tech mt-0.5">
                {[result.generation?.name, result.generation?.bodies?.[0]?.name, result.engine ? `${result.engine.type} ${result.engine.capacity}L` : null, result.engine?.power?.hp ? `${result.engine.power.hp}hp` : null].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {result.technical?.bolt_pattern && (
                <span className="bg-primary/10 text-primary px-3 py-1 text-xs font-tech uppercase" data-testid={`text-fitment-pcd-${index}`}>
                  {result.technical.bolt_pattern}
                </span>
              )}
              {result.technical?.centre_bore && (
                <span className="bg-white/5 text-white/60 px-3 py-1 text-xs font-tech">
                  CB: {result.technical.centre_bore}mm
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <h4 className="text-xs font-tech uppercase text-white/40 tracking-wider mb-3">{t('fitment.wheelOptions')}</h4>
            <div className="space-y-2">
              {result.wheels?.map((w, wIdx) => (
                <WheelRow key={wIdx} wheel={w} index={wIdx} />
              ))}
            </div>
          </div>

          {result.technical?.wheel_fasteners && (
            <div className="border-t border-white/5 mt-4 pt-3 flex flex-wrap gap-4 text-xs text-white/30 font-tech">
              <span>{t('fitment.fastenerType')}: {result.technical.wheel_fasteners.type}</span>
              <span>{t('fitment.threadSize')}: {result.technical.wheel_fasteners.thread_size}</span>
              {result.technical.wheel_tightening_torque && (
                <span>{t('fitment.torque')}: {result.technical.wheel_tightening_torque}</span>
              )}
            </div>
          )}

          <div className="border-t border-white/5 mt-4 pt-4 flex flex-wrap gap-3">
            <button
              onClick={handleAddToGarage}
              disabled={saving || saved}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-tech uppercase tracking-wider transition-colors ${saved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'} disabled:opacity-50`}
              data-testid={`button-add-garage-${index}`}
            >
              {saved ? <CheckCircle className="w-3.5 h-3.5" /> : saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {saved ? t('garage.added') : t('garage.addToGarage')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WheelRow({ wheel, index }: { wheel: WheelFitment; index: number }) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const f = wheel.front;
  const r = wheel.rear;
  const hasRear = r && r.rim && r.tire;
  const isStaggered = hasRear && (r.rim !== f.rim || r.tire !== f.tire);

  const handleCompare = () => {
    const params = new URLSearchParams({
      diameter: String(f.rim_diameter),
      width: String(f.rim_width),
      offset: String(f.rim_offset),
      tyreWidth: String(f.tire_width),
      tyreProfile: String(f.tire_aspect_ratio),
    });
    setLocation(`/fitment-calculator?${params}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm bg-white/[0.02] px-3 py-2 border border-white/5" data-testid={`row-wheel-${index}`}>
      <CheckCircle className="w-3.5 h-3.5 text-green-500/60 flex-shrink-0" />
      <div className="flex flex-wrap gap-x-6 gap-y-1 flex-1">
        <div>
          <span className="text-white/30 text-xs font-tech mr-1">{isStaggered ? t('fitment.front') + ":" : t('fitment.rim') + ":"}</span>
          <span className="text-white font-tech">{f.rim}</span>
        </div>
        <div>
          <span className="text-white/30 text-xs font-tech mr-1">{t('fitment.tire')}:</span>
          <span className="text-white/70 font-tech text-xs">{f.tire}</span>
        </div>
        {isStaggered && r && (
          <>
            <div className="w-full h-0 sm:hidden" />
            <div>
              <span className="text-white/30 text-xs font-tech mr-1">{t('fitment.rear')}:</span>
              <span className="text-white font-tech">{r.rim}</span>
            </div>
            <div>
              <span className="text-white/30 text-xs font-tech mr-1">{t('fitment.tire')}:</span>
              <span className="text-white/70 font-tech text-xs">{r.tire}</span>
            </div>
          </>
        )}
      </div>
      <button
        onClick={handleCompare}
        className="flex items-center gap-1.5 text-xs font-tech uppercase text-primary/70 hover:text-primary transition-colors ml-auto"
        data-testid={`button-compare-${index}`}
      >
        {t('fitment.compareInCalc')}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default VehicleFitment;
