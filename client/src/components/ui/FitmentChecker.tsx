import { useState, useEffect } from "react";
import { Car, ChevronDown, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/language";

interface MakeItem { slug: string; name: string; name_en: string; }
interface ModelItem { slug: string; name: string; name_en: string; }
interface YearItem { slug: number; name: number; }
interface ModificationItem { slug: string; name: string; }

interface SearchResult {
  technical: {
    stud_holes: number;
    pcd: number;
    centre_bore: string;
    bolt_pattern: string;
  };
}

interface FitmentCheckerProps {
  wheelPcd: string | null;
}

function expandWheelPCDs(pcd: string | null): string[] {
  if (!pcd) return [];
  const cleaned = pcd.replace(",", ".").replace(/\s/g, "");
  const dual = cleaned.match(/^([3-8])\/([3-8])x([\d.]+)$/);
  if (dual) return [`${dual[1]}x${dual[3]}`, `${dual[2]}x${dual[3]}`];
  return /^\d+x[\d.]+$/.test(cleaned) ? [cleaned] : [];
}

function normalizePCD(pcd: string): { bolts: number; diameter: number } | null {
  const cleaned = pcd.replace(",", ".").replace(/\s/g, "");
  const match = cleaned.match(/^(\d+)x([\d.]+)$/);
  if (!match) return null;
  return { bolts: parseInt(match[1]), diameter: parseFloat(match[2]) };
}

function pcdMatches(wheelPCD: string, vehicleBolts: number, vehiclePCDDiameter: number): boolean {
  const parsed = normalizePCD(wheelPCD);
  if (!parsed) return false;
  return parsed.bolts === vehicleBolts && Math.abs(parsed.diameter - vehiclePCDDiameter) < 0.5;
}

export function FitmentChecker({ wheelPcd }: FitmentCheckerProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
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

  const wheelPCDs = expandWheelPCDs(wheelPcd);

  useEffect(() => {
    if (!isOpen || makes.length > 0) return;
    setLoadingMakes(true);
    fetch("/api/wheel-size/makes")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((resp) => setMakes(Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []))
      .catch(() => setError(t('fitmentCheck.errorLoading') || "Could not load vehicle data"))
      .finally(() => setLoadingMakes(false));
  }, [isOpen]);

  useEffect(() => {
    if (!selectedMake) { setModels([]); setSelectedModel(""); return; }
    setLoadingModels(true);
    setModels([]); setSelectedModel("");
    setYears([]); setSelectedYear("");
    setModifications([]); setSelectedModification("");
    setResults(null); setError(null);
    fetch(`/api/wheel-size/models?make=${encodeURIComponent(selectedMake)}`)
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((resp) => setModels(Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []))
      .catch(() => {})
      .finally(() => setLoadingModels(false));
  }, [selectedMake]);

  useEffect(() => {
    if (!selectedMake || !selectedModel) { setYears([]); setSelectedYear(""); return; }
    setLoadingYears(true);
    setYears([]); setSelectedYear("");
    setModifications([]); setSelectedModification("");
    setResults(null); setError(null);
    fetch(`/api/wheel-size/years?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}`)
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((resp) => setYears(Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []))
      .catch(() => {})
      .finally(() => setLoadingYears(false));
  }, [selectedMake, selectedModel]);

  useEffect(() => {
    if (!selectedMake || !selectedModel || !selectedYear) { setModifications([]); setSelectedModification(""); return; }
    setLoadingMods(true);
    setModifications([]); setSelectedModification("");
    setResults(null); setError(null);
    fetch(`/api/wheel-size/modifications?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}&year=${encodeURIComponent(selectedYear)}`)
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((resp) => setModifications(Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []))
      .catch(() => {})
      .finally(() => setLoadingMods(false));
  }, [selectedMake, selectedModel, selectedYear]);

  useEffect(() => {
    if (!selectedMake || !selectedModel || !selectedYear) return;
    setLoadingSearch(true);
    setError(null);
    setResults(null);
    const params = new URLSearchParams({ make: selectedMake, model: selectedModel, year: selectedYear });
    if (selectedModification) params.set("modification", selectedModification);
    fetch(`/api/wheel-size/search?${params}`)
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((resp) => {
        const items = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
        setResults(items);
      })
      .catch(() => setError(t('fitmentCheck.errorSearch') || "Could not check fitment"))
      .finally(() => setLoadingSearch(false));
  }, [selectedMake, selectedModel, selectedYear, selectedModification]);

  const selectClass = "w-full bg-black border border-white/20 text-white p-2.5 text-sm font-tech uppercase tracking-wider focus:border-primary outline-none transition-colors appearance-none cursor-pointer";
  const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23E9D355' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' };

  let fitmentResult: "compatible" | "not_compatible" | "unknown" | null = null;
  let vehiclePCDDisplay = "";

  if (results && results.length > 0 && wheelPCDs.length > 0) {
    const vehicleTech = results[0].technical;
    const vehicleBolts = vehicleTech.stud_holes;
    const vehiclePCDDiam = vehicleTech.pcd;
    vehiclePCDDisplay = vehicleTech.bolt_pattern || `${vehicleBolts}x${vehiclePCDDiam}`;

    const compatible = wheelPCDs.some(wp => pcdMatches(wp, vehicleBolts, vehiclePCDDiam));
    fitmentResult = compatible ? "compatible" : "not_compatible";
  } else if (results && results.length > 0 && wheelPCDs.length === 0) {
    fitmentResult = "unknown";
  }

  return (
    <div className="border border-white/10 bg-white/[0.02]" data-testid="fitment-checker">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 group hover:bg-white/5 transition-colors"
        data-testid="button-fitment-toggle"
      >
        <div className="flex items-center gap-3">
          <Car className="w-5 h-5 text-primary" />
          <span className="text-white font-tech uppercase tracking-widest text-sm">
            {t('fitmentCheck.title') || 'Does it fit my car?'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
          {wheelPCDs.length > 0 && (
            <div className="flex items-center gap-2 text-[10px] font-tech uppercase tracking-wider text-white/40">
              <span>{t('fitmentCheck.wheelPCD') || 'Wheel PCD'}:</span>
              <span className="text-primary">{wheelPCDs.join(" / ")}</span>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-xs font-tech">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className={selectClass}
              style={selectStyle}
              disabled={loadingMakes}
              data-testid="select-fitment-make"
            >
              <option value="">{loadingMakes ? "..." : (t('fitmentCheck.selectMake') || "Make")}</option>
              {makes.map((m) => (
                <option key={m.slug} value={m.slug}>{m.name_en || m.name}</option>
              ))}
            </select>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={selectClass}
              style={selectStyle}
              disabled={!selectedMake || loadingModels}
              data-testid="select-fitment-model"
            >
              <option value="">{loadingModels ? "..." : (t('fitmentCheck.selectModel') || "Model")}</option>
              {models.map((m) => (
                <option key={m.slug} value={m.slug}>{m.name_en || m.name}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={selectClass}
              style={selectStyle}
              disabled={!selectedModel || loadingYears}
              data-testid="select-fitment-year"
            >
              <option value="">{loadingYears ? "..." : (t('fitmentCheck.selectYear') || "Year")}</option>
              {years.map((y) => (
                <option key={y.slug} value={String(y.slug)}>{y.name}</option>
              ))}
            </select>

            <select
              value={selectedModification}
              onChange={(e) => setSelectedModification(e.target.value)}
              className={selectClass}
              style={selectStyle}
              disabled={!selectedYear || loadingMods}
              data-testid="select-fitment-trim"
            >
              <option value="">{loadingMods ? "..." : (t('fitmentCheck.selectTrim') || "Trim (optional)")}</option>
              {modifications.map((m) => (
                <option key={m.slug} value={m.slug}>{m.name}</option>
              ))}
            </select>
          </div>

          {loadingSearch && (
            <div className="flex items-center justify-center gap-2 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-white/50 text-xs font-tech uppercase tracking-wider">
                {t('fitmentCheck.checking') || 'Checking...'}
              </span>
            </div>
          )}

          {fitmentResult === "compatible" && (
            <div className="flex items-center gap-3 p-4 border border-green-500/30 bg-green-500/10" data-testid="fitment-result-compatible">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-400 font-tech uppercase tracking-wider text-sm font-bold">
                  {t('fitmentCheck.compatible') || 'Compatible'}
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  {t('fitmentCheck.pcdMatch') || 'PCD matches your vehicle'} ({vehiclePCDDisplay})
                </p>
              </div>
            </div>
          )}

          {fitmentResult === "not_compatible" && (
            <div className="flex items-center gap-3 p-4 border border-red-500/30 bg-red-500/10" data-testid="fitment-result-incompatible">
              <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-tech uppercase tracking-wider text-sm font-bold">
                  {t('fitmentCheck.notCompatible') || 'Not Compatible'}
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  {t('fitmentCheck.pcdMismatch') || 'PCD does not match'} — {t('fitmentCheck.yourCar') || 'Your car'}: {vehiclePCDDisplay}, {t('fitmentCheck.thisWheel') || 'This wheel'}: {wheelPCDs.join("/")}
                </p>
              </div>
            </div>
          )}

          {fitmentResult === "unknown" && (
            <div className="flex items-center gap-3 p-4 border border-yellow-500/30 bg-yellow-500/10" data-testid="fitment-result-unknown">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-yellow-400 font-tech uppercase tracking-wider text-sm font-bold">
                  {t('fitmentCheck.cannotVerify') || 'Cannot Verify'}
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  {t('fitmentCheck.noPCDFound') || 'PCD not found in product listing. Contact us for fitment advice.'}
                </p>
              </div>
            </div>
          )}

          {!fitmentResult && !loadingSearch && selectedMake && (
            <p className="text-white/30 text-[10px] font-tech uppercase tracking-wider text-center">
              {t('fitmentCheck.selectAll') || 'Select make, model and year to check fitment'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
