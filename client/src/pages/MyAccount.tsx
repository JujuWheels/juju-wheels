import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Package, Settings2, LogOut, Ruler, Car, ArrowRight, Loader2, ChevronDown, ChevronUp, ShoppingBag, Truck, Clock, CheckCircle2, XCircle, AlertCircle, Pencil, Save, X } from "lucide-react";
import type { SavedSpec } from "@shared/schema";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";

export default function MyAccount() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  const { data: savedSpecs = [], isLoading: specsLoading } = useQuery<SavedSpec[]>({
    queryKey: ["/api/saved-specs"],
    queryFn: async () => {
      const res = await fetch("/api/saved-specs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load specs");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: orders = [], isLoading: ordersLoading, isError: ordersError } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json();
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const startEditing = () => {
    setEditPhone(user?.phone || "");
    setEditEmail(user?.marketingEmail || "");
    setEditAddress(user?.address || "");
    setEditCity(user?.city || "");
    setEditPostalCode(user?.postalCode || "");
    setEditCountry(user?.country || "");
    setEditInstagram(user?.instagram || "");
    setEditError("");
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    setEditError("");
    if (!editPhone.trim() || editPhone.trim().length < 5) { setEditError(t('profile.phoneError')); setSaving(false); return; }
    if (!editEmail.trim() || !editEmail.includes("@")) { setEditError(t('profile.emailError')); setSaving(false); return; }
    if (!editAddress.trim() || editAddress.trim().length < 3) { setEditError(t('profile.addressError')); setSaving(false); return; }
    if (!editCity.trim() || editCity.trim().length < 2) { setEditError(t('profile.cityError')); setSaving(false); return; }
    if (!editPostalCode.trim() || editPostalCode.trim().length < 3) { setEditError(t('profile.postalCodeError')); setSaving(false); return; }
    if (!editCountry.trim() || editCountry.trim().length < 2) { setEditError(t('profile.countryError')); setSaving(false); return; }
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: editPhone,
          marketingEmail: editEmail,
          address: editAddress,
          city: editCity,
          postalCode: editPostalCode,
          country: editCountry,
          instagram: editInstagram || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.message || "Failed to update");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditing(false);
    } catch {
      setEditError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const { data: garageVehicles = [], isLoading: garageLoading } = useQuery<any[]>({
    queryKey: ["/api/garage"],
    queryFn: async () => {
      const res = await fetch("/api/garage", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load garage");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const queryClient = useQueryClient();
  const handleDeleteSpec = async (id: number) => {
    await fetch(`/api/saved-specs/${id}`, { method: "DELETE", credentials: "include" });
    queryClient.invalidateQueries({ queryKey: ["/api/saved-specs"] });
  };

  const handleDeleteVehicle = async (id: number) => {
    await fetch(`/api/garage/${id}`, { method: "DELETE", credentials: "include" });
    queryClient.invalidateQueries({ queryKey: ["/api/garage"] });
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const shopifyDomain = "juju-wheels.com";

  return (
    <div className="bg-black text-white">
      <SEO title="My Account" noindex />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-heading text-2xl md:text-3xl uppercase tracking-wider mb-6 text-center" data-testid="text-account-title">
          {t('account.title')}
        </h1>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1 space-y-4">
            <div className="border border-white/10 p-6" data-testid="card-profile">
              <div className="flex items-center gap-4 mb-5">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-14 h-14 rounded-full border-2 border-primary" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                    <Settings2 className="w-6 h-6 text-white/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-base uppercase truncate" data-testid="text-user-name">
                    {user?.firstName} {user?.lastName}
                  </p>
                  {!editing && user?.marketingEmail && (
                    <p className="text-sm text-white/50 truncate" data-testid="text-user-email">{user.marketingEmail}</p>
                  )}
                </div>
                {!editing && (
                  <Button
                    onClick={startEditing}
                    variant="ghost"
                    size="icon"
                    className="text-white/30 hover:text-primary shrink-0"
                    data-testid="button-edit-profile"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {editing ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">{t('account.phone')}</label>
                    <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
                      placeholder="+31 6 1234 5678" data-testid="input-edit-phone" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">Email</label>
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
                      placeholder="email@example.com" data-testid="input-edit-email" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">{t('profile.address')}</label>
                    <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
                      placeholder="Kerkstraat 42" data-testid="input-edit-address" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">{t('profile.city')}</label>
                      <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
                        placeholder="Amsterdam" data-testid="input-edit-city" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">{t('profile.postalCode')}</label>
                      <input type="text" value={editPostalCode} onChange={(e) => setEditPostalCode(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
                        placeholder="1012 AB" data-testid="input-edit-postal-code" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">{t('profile.country')}</label>
                    <input type="text" value={editCountry} onChange={(e) => setEditCountry(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
                      placeholder="Netherlands" data-testid="input-edit-country" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-tech uppercase tracking-wider text-white/50 mb-1">Instagram <span className="text-white/30">({t('profile.optional')})</span></label>
                    <input type="text" value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
                      placeholder="@yourusername" data-testid="input-edit-instagram" />
                  </div>
                  {editError && <p className="text-red-400 text-xs">{editError}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button onClick={saveProfile} disabled={saving}
                      className="flex-1 bg-primary text-black font-tech uppercase text-xs tracking-wider h-9"
                      data-testid="button-save-profile">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1.5" /> {t('account.save')}</>}
                    </Button>
                    <Button onClick={() => setEditing(false)} variant="outline"
                      className="border-white/20 text-white/50 font-tech uppercase text-xs tracking-wider h-9"
                      data-testid="button-cancel-edit">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {user?.phone && (
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-white/50">{t('account.phone')}</span>
                      <span data-testid="text-user-phone">{user.phone}</span>
                    </div>
                  )}
                  {user?.email && (
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-white/50">{t('account.replitEmail')}</span>
                      <span data-testid="text-user-replit-email" className="truncate ml-2">{user.email}</span>
                    </div>
                  )}
                  {user?.address && (
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-white/50">{t('profile.address')}</span>
                      <span className="text-right ml-2">{user.address}</span>
                    </div>
                  )}
                  {(user?.city || user?.postalCode) && (
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-white/50">{t('profile.city')}</span>
                      <span className="text-right ml-2">{[user?.postalCode, user?.city].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {user?.country && (
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-white/50">{t('profile.country')}</span>
                      <span>{user.country}</span>
                    </div>
                  )}
                  {user?.instagram && (
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-white/50">Instagram</span>
                      <span>{user.instagram}</span>
                    </div>
                  )}
                  {user?.createdAt && (
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-white/50">{t('account.memberSince')}</span>
                      <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={() => logout()}
              variant="outline"
              className="w-full border-white/20 text-white/70 hover:text-white hover:border-red-500/50 hover:bg-red-500/10 uppercase font-tech tracking-wider text-xs"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('account.logOut')}
            </Button>
          </div>

          <div className="md:col-span-2 space-y-6">
            <section data-testid="section-orders">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-xl uppercase tracking-wider">{t('account.previousOrders')}</h2>
              </div>

              {ordersLoading ? (
                <div className="border border-white/10 p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : ordersError ? (
                <div className="border border-white/10 p-6">
                  <p className="text-white/50 text-sm mb-4">{t('account.ordersDesc')}</p>
                  <a
                    href={`https://${shopifyDomain}/account`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-primary text-black px-5 py-2.5 font-tech uppercase text-xs tracking-wider font-bold hover:bg-primary/90 transition-colors"
                    data-testid="link-shopify-orders-fallback"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('account.viewOrdersShopify')}
                  </a>
                </div>
              ) : orders.length === 0 ? (
                <div className="border border-white/10 p-8 text-center">
                  <ShoppingBag className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 text-sm mb-2">{t('account.noOrders')}</p>
                  <p className="text-white/30 text-xs mb-4">{t('account.noOrdersDesc')}</p>
                  <Button
                    onClick={() => navigate("/collections/wheels-for-sale")}
                    className="bg-primary text-black font-tech uppercase text-xs tracking-wider font-bold hover:bg-primary/90"
                    data-testid="button-browse-shop"
                  >
                    {t('account.browseWheels')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order: any) => {
                    const isExpanded = expandedOrder === order.id;
                    const totalItems = order.lineItems.reduce((sum: number, li: any) => sum + li.quantity, 0);
                    const statusColor = order.financialStatus === "PAID" ? "text-green-400" :
                      order.financialStatus === "REFUNDED" || order.financialStatus === "PARTIALLY_REFUNDED" ? "text-red-400" :
                      "text-yellow-400";
                    const fulfillColor = order.fulfillmentStatus === "FULFILLED" ? "text-green-400" :
                      order.fulfillmentStatus === "PARTIALLY_FULFILLED" ? "text-yellow-400" :
                      "text-white/50";
                    const StatusIcon = order.financialStatus === "PAID" ? CheckCircle2 :
                      order.financialStatus === "REFUNDED" ? XCircle : Clock;
                    const FulfillIcon = order.fulfillmentStatus === "FULFILLED" ? Truck :
                      order.fulfillmentStatus === "PARTIALLY_FULFILLED" ? AlertCircle : Clock;

                    return (
                      <div key={order.id} className="border border-white/10 hover:border-white/20 transition-colors" data-testid={`card-order-${order.name}`}>
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="w-full p-4 flex items-center gap-4 text-left"
                          data-testid={`button-expand-order-${order.name}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-heading text-sm uppercase tracking-wider">{order.name}</span>
                              <span className="text-xs text-white/40">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-xs ${statusColor}`}>
                                <StatusIcon className="w-3 h-3" />
                                {order.financialStatus === "PAID" ? t('account.paid') :
                                 order.financialStatus === "REFUNDED" ? t('account.refunded') :
                                 t('account.pending')}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-xs ${fulfillColor}`}>
                                <FulfillIcon className="w-3 h-3" />
                                {order.fulfillmentStatus === "FULFILLED" ? t('account.fulfilled') :
                                 order.fulfillmentStatus === "PARTIALLY_FULFILLED" ? t('account.partiallyFulfilled') :
                                 t('account.unfulfilled')}
                              </span>
                              <span className="text-xs text-white/40">
                                {totalItems} {totalItems === 1 ? t('account.orderItem') : t('account.orderItems')}
                              </span>
                              {order.shippingCity && (
                                <span className="text-xs text-white/30">{order.shippingCity}, {order.shippingCountry}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex items-center gap-3">
                            <span className="font-heading text-sm">
                              {order.totalPrice?.currencyCode} {parseFloat(order.totalPrice?.amount || 0).toFixed(2)}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-white/10 p-4 space-y-3 bg-white/[0.02]">
                            {order.lineItems.map((li: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3" data-testid={`order-item-${order.name}-${idx}`}>
                                {li.imageUrl ? (
                                  <img src={li.imageUrl} alt={li.name} className="w-14 h-14 object-cover border border-white/10 shrink-0" />
                                ) : (
                                  <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5 text-white/20" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{li.name}</p>
                                  {li.variantTitle && li.variantTitle !== "Default Title" && (
                                    <p className="text-xs text-white/40">{li.variantTitle}</p>
                                  )}
                                  <p className="text-xs text-white/40">Qty: {li.quantity}</p>
                                </div>
                                {li.totalPrice && (
                                  <span className="text-sm text-white/60 shrink-0">
                                    {li.totalPrice.currencyCode} {parseFloat(li.totalPrice.amount).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            ))}
                            <div className="pt-2 border-t border-white/5 flex justify-between text-xs text-white/40">
                              {order.shippingPrice && (
                                <span>Shipping: {order.shippingPrice.currencyCode} {parseFloat(order.shippingPrice.amount).toFixed(2)}</span>
                              )}
                              <a
                                href={`https://${shopifyDomain}/account`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary/60 hover:text-primary transition-colors inline-flex items-center gap-1"
                                data-testid={`link-order-detail-${order.name}`}
                              >
                                {t('account.viewOrdersShopify')} <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section data-testid="section-garage">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-primary" />
                  <h2 className="font-heading text-xl uppercase tracking-wider">{t('garage.title')}</h2>
                </div>
                <Button
                  onClick={() => navigate("/vehicle-fitment")}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 text-primary hover:bg-primary/10 font-tech text-xs uppercase tracking-wider"
                  data-testid="button-add-vehicle"
                >
                  {t('garage.addToGarage')}
                </Button>
              </div>

              {garageLoading ? (
                <div className="border border-white/10 p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : garageVehicles.length === 0 ? (
                <div className="border border-white/10 p-8 text-center">
                  <Car className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 text-sm mb-4">{t('garage.empty')}</p>
                  <Button
                    onClick={() => navigate("/vehicle-fitment")}
                    className="bg-primary text-black font-tech uppercase text-xs tracking-wider font-bold hover:bg-primary/90"
                    data-testid="button-find-vehicle"
                  >
                    {t('garage.goToFitment')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {garageVehicles.map((v: any) => (
                    <div
                      key={v.id}
                      className="border border-white/10 p-4 flex items-center gap-4 hover:border-white/20 transition-colors"
                      data-testid={`card-garage-account-${v.id}`}
                    >
                      {v.imageUrl && (
                        <img src={v.imageUrl} alt={`${v.make} ${v.model}`} className="w-20 h-14 object-contain flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-sm uppercase tracking-wider truncate">
                          {user?.firstName ? `${user.firstName}'s ` : ''}{v.year} {v.make} {v.model}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-white/50">
                          {v.trim && <span>{v.trim}</span>}
                          {v.boltPattern && <span>{v.boltPattern}</span>}
                          {v.centreBore && <span>CB: {v.centreBore}mm</span>}
                          {v.specs?.engine?.power?.hp && <span>{v.specs.engine.power.hp}hp</span>}
                        </div>
                        {v.createdAt && (
                          <p className="text-[10px] text-white/30 mt-1">
                            {t('account.saved')} {new Date(v.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          onClick={() => navigate("/my-garage")}
                          variant="ghost"
                          size="icon"
                          className="text-white/30 hover:text-primary hover:bg-primary/10"
                          data-testid={`button-view-garage-${v.id}`}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteVehicle(v.id)}
                          variant="ghost"
                          size="icon"
                          className="text-white/30 hover:text-red-400 hover:bg-red-500/10"
                          data-testid={`button-delete-vehicle-${v.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <a
                    href="/my-garage"
                    className="block text-center text-xs font-tech uppercase tracking-wider text-primary/60 hover:text-primary transition-colors py-2"
                    data-testid="link-view-all-garage"
                  >
                    {t('garage.title')} →
                  </a>
                </div>
              )}
            </section>

            <section data-testid="section-saved-specs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Ruler className="w-5 h-5 text-primary" />
                  <h2 className="font-heading text-xl uppercase tracking-wider">{t('account.savedSpecs')}</h2>
                </div>
                <Button
                  onClick={() => navigate("/wheel-spec-calculator")}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 text-primary hover:bg-primary/10 font-tech text-xs uppercase tracking-wider"
                  data-testid="button-new-spec"
                >
                  {t('account.newSpec')}
                </Button>
              </div>

              {specsLoading ? (
                <div className="border border-white/10 p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : savedSpecs.length === 0 ? (
                <div className="border border-white/10 p-8 text-center">
                  <Ruler className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 text-sm mb-4">{t('account.noSavedSpecs')}</p>
                  <Button
                    onClick={() => navigate("/wheel-spec-calculator")}
                    className="bg-primary text-black font-tech uppercase text-xs tracking-wider font-bold hover:bg-primary/90"
                    data-testid="button-create-first-spec"
                  >
                    {t('account.createFirstSpec')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSpecs.map((spec) => (
                    <div
                      key={spec.id}
                      className="border border-white/10 p-4 flex items-center justify-between hover:border-white/20 transition-colors"
                      data-testid={`card-spec-${spec.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-sm uppercase tracking-wider truncate" data-testid={`text-spec-name-${spec.id}`}>
                          {spec.name}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-white/50">
                          <span>{spec.diameter}" × {spec.totalWidth}"</span>
                          <span>ET{spec.currentET}</span>
                          <span className="capitalize">{spec.mountingStyle} mount</span>
                          {spec.addOuterLip > 0 && <span>+{spec.addOuterLip}" outer</span>}
                          {spec.addInnerBarrel > 0 && <span>+{spec.addInnerBarrel}" inner</span>}
                        </div>
                        {spec.createdAt && (
                          <p className="text-[10px] text-white/30 mt-1">
                            {t('account.saved')} {new Date(spec.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteSpec(spec.id)}
                        variant="ghost"
                        size="icon"
                        className="text-white/30 hover:text-red-400 hover:bg-red-500/10 shrink-0 ml-2"
                        data-testid={`button-delete-spec-${spec.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section data-testid="section-quick-links">
              <h2 className="font-heading text-xl uppercase tracking-wider mb-4">{t('account.quickLinks')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="/fitment-calculator"
                  className="border border-white/10 p-4 hover:border-primary/30 hover:bg-white/5 transition-colors flex items-center gap-3"
                  data-testid="link-fitment-calc"
                >
                  <Ruler className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="font-tech text-xs uppercase tracking-wider">{t('account.fitmentCalc')}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{t('account.fitmentCalcDesc')}</p>
                  </div>
                </a>
                <a
                  href="/wheel-spec-calculator"
                  className="border border-white/10 p-4 hover:border-primary/30 hover:bg-white/5 transition-colors flex items-center gap-3"
                  data-testid="link-spec-calc"
                >
                  <Settings2 className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="font-tech text-xs uppercase tracking-wider">{t('account.specCalc')}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{t('account.specCalcDesc')}</p>
                  </div>
                </a>
                <a
                  href="/collections/wheels-for-sale"
                  className="border border-white/10 p-4 hover:border-primary/30 hover:bg-white/5 transition-colors flex items-center gap-3"
                  data-testid="link-browse-wheels"
                >
                  <Package className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="font-tech text-xs uppercase tracking-wider">{t('account.browseWheels')}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{t('account.browseWheelsDesc')}</p>
                  </div>
                </a>
                <a
                  href="/pages/custom-requests"
                  className="border border-white/10 p-4 hover:border-primary/30 hover:bg-white/5 transition-colors flex items-center gap-3"
                  data-testid="link-custom-requests"
                >
                  <ExternalLink className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="font-tech text-xs uppercase tracking-wider">{t('account.customRequests')}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{t('account.customRequestsDesc')}</p>
                  </div>
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
