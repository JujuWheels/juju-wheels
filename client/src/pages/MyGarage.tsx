import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getCollectionByHandle, shopifyImageUrl, type Product } from "@/lib/shopify";
import { Car, Trash2, ArrowRight, Loader2, Search, ShoppingBag } from "lucide-react";
import { SEO } from "@/components/SEO";

interface WheelSpec {
  front: { rim: string; rim_diameter: number; rim_width: number; rim_offset: number; tire: string; tire_width: number; tire_aspect_ratio: number };
  rear: { rim: string; rim_diameter: number; rim_width: number; rim_offset: number; tire: string; tire_width: number; tire_aspect_ratio: number } | null;
}

interface VehicleSpecs {
  generation?: string | null;
  body?: string | null;
  engine?: { fuel: string; capacity: string; type: string; power: { kW: number; PS: number; hp: number }; code: string } | null;
  fasteners?: { type: string; thread_size: string } | null;
  torque?: string | null;
}

interface GarageVehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  boltPattern: string | null;
  centreBore: string | null;
  imageUrl: string | null;
  wheels: WheelSpec[] | null;
  specs: VehicleSpecs | null;
  createdAt: string;
}

function normalizePCD(raw: string): { bolts: number; diameter: number } | null {
  const cleaned = raw.replace(/×/g, "x").replace(",", ".").replace(/\s+/g, "");
  const match = cleaned.match(/^(\d+)x([\d.]+)$/);
  if (!match) return null;
  return { bolts: parseInt(match[1]), diameter: parseFloat(match[2]) };
}

function extractProductPCDs(title: string, description?: string): { bolts: number; diameter: number }[] {
  const combined = `${title} ${description || ""}`;
  const matches = combined.match(/(\d+)\s*x\s*(\d+[.,]?\d*)/gi);
  if (!matches) return [];
  const results = matches
    .map(m => normalizePCD(m.replace(",", ".").replace(/\s/g, "")))
    .filter((p): p is NonNullable<typeof p> => p !== null && p.bolts >= 3 && p.bolts <= 8 && p.diameter >= 90 && p.diameter <= 160);
  const seen = new Set<string>();
  return results.filter(p => {
    const key = `${p.bolts}x${p.diameter}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isProductCompatible(product: Product, vehiclePCD: { bolts: number; diameter: number }): boolean {
  const productPCDs = extractProductPCDs(product.title, product.description);
  return productPCDs.some(pp => pp.bolts === vehiclePCD.bolts && Math.abs(pp.diameter - vehiclePCD.diameter) < 0.5);
}

function CompatibleWheelsSection({ products, vehicleId, isLoading }: { products: Product[]; vehicleId: number; isLoading: boolean }) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="border-t border-white/5 mt-4 pt-4">
        <div className="flex items-center gap-2 text-xs font-tech uppercase text-white/30 tracking-wider">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {t('garage.loadingCompatible') || 'Finding compatible wheels...'}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border-t border-white/5 mt-4 pt-4">
        <p className="text-white/30 text-xs font-tech uppercase tracking-wider">
          {t('garage.noCompatibleWheels') || 'No compatible wheels currently in stock'}
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-white/5 mt-4 pt-4" data-testid={`section-compatible-wheels-${vehicleId}`}>
      <h4 className="text-xs font-tech uppercase text-primary tracking-wider flex items-center gap-2 mb-3">
        <ShoppingBag className="w-3.5 h-3.5" />
        {t('garage.compatibleWheels') || 'Compatible Wheels For Sale'} ({products.length})
      </h4>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" style={{ scrollbarWidth: 'thin' }}>
        {products.map((product) => {
          const img = product.images.edges[0]?.node;
          const price = product.priceRange.minVariantPrice;
          const compareAt = product.compareAtPriceRange?.minVariantPrice;
          const isOnSale = compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount);
          return (
            <Link
              key={product.id}
              href={`/products/${product.handle}`}
              className="flex-shrink-0 w-[45%] md:w-[23%] snap-start group border border-white/5 bg-white/[0.02] hover:border-primary/30 transition-all"
              data-testid={`link-compatible-wheel-${product.handle}`}
            >
              {img && (
                <div className="aspect-square bg-white/5 overflow-hidden">
                  <img
                    src={shopifyImageUrl(img.url, 300)}
                    alt={img.altText || product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    width={300}
                    height={300}
                  />
                </div>
              )}
              <div className="p-2.5">
                <p className="text-white text-xs font-tech uppercase tracking-wider line-clamp-2 leading-tight mb-1.5">
                  {product.title}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-tech ${isOnSale ? 'text-red-400' : 'text-primary'}`}>
                    €{parseFloat(price.amount).toFixed(0)}
                  </span>
                  {isOnSale && compareAt && (
                    <span className="text-white/30 text-xs line-through font-tech">
                      €{parseFloat(compareAt.amount).toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function MyGarage() {
  const { t } = useLanguage();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const firstName = user?.firstName;
  const [, setLocation] = useLocation();
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) return;
    if (!isAuthenticated) return;
    setLoading(true);
    fetch("/api/garage", { credentials: "include" })
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((data) => setVehicles(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading]);

  const hasVehiclesWithPCD = vehicles.some(v => !!v.boltPattern);

  const { data: wheelsCollection, isLoading: wheelsLoading } = useQuery({
    queryKey: ["collection", "wheels-for-sale"],
    queryFn: () => getCollectionByHandle("wheels-for-sale"),
    enabled: hasVehiclesWithPCD && !loading,
    staleTime: 5 * 60 * 1000,
  });

  const allWheelProducts = useMemo(() => {
    if (!wheelsCollection?.products?.edges) return [];
    return wheelsCollection.products.edges.map((e: { node: Product }) => e.node);
  }, [wheelsCollection]);

  const compatibleWheelsMap = useMemo(() => {
    const map = new Map<number, Product[]>();
    for (const vehicle of vehicles) {
      if (!vehicle.boltPattern) continue;
      const vehiclePCD = normalizePCD(vehicle.boltPattern);
      if (!vehiclePCD) continue;
      const compatible = allWheelProducts.filter(p => isProductCompatible(p, vehiclePCD));
      map.set(vehicle.id, compatible);
    }
    return map;
  }, [vehicles, allWheelProducts]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/garage/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleCompare = (spec: WheelSpec["front"]) => {
    const params = new URLSearchParams({
      diameter: String(spec.rim_diameter),
      width: String(spec.rim_width),
      offset: String(spec.rim_offset),
      tyreWidth: String(spec.tire_width),
      tyreProfile: String(spec.tire_aspect_ratio),
    });
    setLocation(`/fitment-calculator?${params}`);
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <Car className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-display uppercase text-white mb-4">{t('garage.title')}</h1>
          <p className="text-white/50 text-sm mb-8">{t('garage.loginRequired')}</p>
          <a href="/login" className="inline-block bg-primary text-black px-6 py-3 font-tech uppercase text-sm tracking-wider hover:bg-primary/90 transition-colors" data-testid="link-garage-login">
            {t('nav.logIn')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28 pb-16">
      <SEO title="My Garage" noindex />
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-display uppercase tracking-tight text-white mb-3" data-testid="text-garage-title">
            {t('garage.title')}
          </h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto">
            {t('garage.subtitle')}
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {!loading && vehicles.length === 0 && (
          <div className="text-center py-16">
            <Car className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <p className="text-white/50 text-lg mb-2">{t('garage.empty')}</p>
            <p className="text-white/30 text-sm mb-8">{t('garage.emptyDesc')}</p>
            <button
              onClick={() => setLocation("/vehicle-fitment")}
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 font-tech uppercase text-sm tracking-wider hover:bg-primary/90 transition-colors"
              data-testid="button-go-fitment"
            >
              <Search className="w-4 h-4" />
              {t('garage.goToFitment')}
            </button>
          </div>
        )}

        {!loading && vehicles.length > 0 && (
          <div className="space-y-6">
            {vehicles.map((vehicle) => {
              const compatible = compatibleWheelsMap.get(vehicle.id) || [];
              return (
              <div key={vehicle.id} className="border border-white/10 bg-white/[0.02] overflow-hidden" data-testid={`card-garage-${vehicle.id}`}>
                <div className="flex flex-col md:flex-row">
                  {vehicle.imageUrl && (
                    <div className="md:w-64 flex-shrink-0 bg-white/5 flex items-center justify-center p-4">
                      <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="max-w-full max-h-40 object-contain" />
                    </div>
                  )}
                  <div className="flex-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-display uppercase text-white" data-testid={`text-garage-name-${vehicle.id}`}>
                          {firstName ? `${firstName}'s ` : ''}{vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-white/40 text-xs font-tech mt-0.5">
                          {[
                            vehicle.trim,
                            vehicle.specs?.generation,
                            vehicle.specs?.body,
                            vehicle.specs?.engine ? `${vehicle.specs.engine.type} ${vehicle.specs.engine.capacity}L` : null,
                            vehicle.specs?.engine?.power?.hp ? `${vehicle.specs.engine.power.hp}hp` : null,
                            vehicle.specs?.engine?.code,
                          ].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {vehicle.boltPattern && (
                          <span className="bg-primary/10 text-primary px-3 py-1 text-xs font-tech uppercase">
                            {vehicle.boltPattern}
                          </span>
                        )}
                        {vehicle.centreBore && (
                          <span className="bg-white/5 text-white/60 px-3 py-1 text-xs font-tech">
                            CB: {vehicle.centreBore}mm
                          </span>
                        )}
                      </div>
                    </div>

                    {vehicle.wheels && Array.isArray(vehicle.wheels) && (vehicle.wheels as WheelSpec[]).length > 0 && (
                      <div className="border-t border-white/5 pt-4">
                        <h4 className="text-xs font-tech uppercase text-white/40 tracking-wider mb-3">{t('garage.factoryWheels')}</h4>
                        <div className="space-y-2">
                          {(vehicle.wheels as WheelSpec[]).map((w, wIdx) => {
                            const f = w.front;
                            const r = w.rear;
                            const hasRear = r && r.rim && r.tire;
                            const isStaggered = hasRear && (r.rim !== f.rim || r.tire !== f.tire);
                            return (
                              <div key={wIdx} className="flex flex-wrap items-center gap-3 text-sm bg-white/[0.02] px-3 py-2 border border-white/5">
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
                                  onClick={() => handleCompare(f)}
                                  className="flex items-center gap-1.5 text-xs font-tech uppercase text-primary/70 hover:text-primary transition-colors"
                                  data-testid={`button-garage-compare-${vehicle.id}-${wIdx}`}
                                >
                                  {t('garage.compareSpecs')}
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {vehicle.specs?.fasteners && (
                      <div className="border-t border-white/5 mt-4 pt-3 flex flex-wrap gap-4 text-xs text-white/30 font-tech">
                        <span>{t('fitment.fastenerType')}: {vehicle.specs.fasteners.type}</span>
                        <span>{t('fitment.threadSize')}: {vehicle.specs.fasteners.thread_size}</span>
                        {vehicle.specs.torque && (
                          <span>{t('fitment.torque')}: {vehicle.specs.torque}</span>
                        )}
                      </div>
                    )}

                    {vehicle.boltPattern && (
                      <CompatibleWheelsSection products={compatible} vehicleId={vehicle.id} isLoading={wheelsLoading} />
                    )}

                    <div className="border-t border-white/5 mt-4 pt-4 flex items-center justify-between gap-4">
                      {vehicle.boltPattern ? (
                        <button
                          onClick={() => {
                            const pcd = vehicle.boltPattern!.replace(/×/g, "x").replace(/\s+/g, "");
                            setLocation(`/collections/wheels-for-sale?pcd=${pcd}`);
                          }}
                          className="flex items-center gap-2 bg-primary text-black px-4 py-2 text-xs font-tech uppercase tracking-wider hover:bg-primary/90 transition-colors"
                          data-testid={`button-garage-compatible-${vehicle.id}`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {t('garage.viewCompatible')}
                          {compatible.length > 0 && (
                            <span className="bg-black/20 px-1.5 py-0.5 text-[10px]">{compatible.length}</span>
                          )}
                        </button>
                      ) : (
                        <div />
                      )}
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        disabled={deleting === vehicle.id}
                        className="flex items-center gap-2 text-xs font-tech uppercase text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
                        data-testid={`button-garage-delete-${vehicle.id}`}
                      >
                        {deleting === vehicle.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        {t('garage.remove')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
