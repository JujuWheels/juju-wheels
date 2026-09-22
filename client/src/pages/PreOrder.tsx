import { useQuery } from "@tanstack/react-query";
import { getProducts, type Product } from "@/lib/shopify";
import { ProductCard } from "@/components/ui/ProductCard";
import { useLanguage } from "@/lib/language";
import { Loader2, Package, ShieldCheck, MapPin, ClipboardCheck, Gavel } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function PreOrder() {
  const { t } = useLanguage();

  const { data: allProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["products", "all-for-preorder"],
    queryFn: () => getProducts(250),
  });

  const preOrderProducts = allProducts
    ? allProducts
        .filter((p: Product) => p.tags?.some((tag: string) => tag.toLowerCase() === "pre-order"))
        .sort((a, b) => {
          if (a.availableForSale === b.availableForSale) return 0;
          return a.availableForSale ? -1 : 1;
        })
    : [];

  const trustPoints = [
    { icon: MapPin, title: t('preorder.trustWarehouse'), desc: t('preorder.trustWarehouseDesc') },
    { icon: Gavel, title: t('preorder.trustOwned'), desc: t('preorder.trustOwnedDesc') },
    { icon: ClipboardCheck, title: t('preorder.trustInspected'), desc: t('preorder.trustInspectedDesc') },
    { icon: Package, title: t('preorder.trustShipping'), desc: t('preorder.trustShippingDesc') },
  ];

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <SEO
        title="Pre-Order — Juju Wheels | Reserve Authentic JDM Wheels from Japan"
        description="Pre-order authentic JDM wheels sourced from Japanese auctions. Professionally inspected on sizing and condition, then shipped to our warehouse in the Netherlands. Delivery approximately 3 months."
      />
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-6 h-6 text-primary" />
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase" data-testid="text-preorder-heading">
              {t('preorder.title')}
            </h1>
            <span className="bg-primary text-black text-xs font-bold uppercase tracking-widest px-3 py-1">
              {t('preorder.badge')}
            </span>
          </div>
          <p className="text-muted-foreground max-w-2xl" data-testid="text-preorder-subtitle">
            {t('preorder.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {trustPoints.map((point, i) => (
            <div key={i} className="border border-white/10 bg-white/[0.02] p-5 flex gap-4 items-start">
              <div className="w-10 h-10 flex items-center justify-center border border-primary/30 bg-primary/10 shrink-0">
                <point.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white text-sm font-tech uppercase tracking-wider mb-1">{point.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{point.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-primary/20 bg-primary/5 p-4 mb-10 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-white/70 text-sm leading-relaxed">
            {t('preorder.notice')}
          </p>
        </div>

        {isLoading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : preOrderProducts.length === 0 ? (
          <div className="py-24 text-center">
            <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 font-tech uppercase tracking-wider text-lg" data-testid="text-no-preorder">
              {t('preorder.noItems')}
            </p>
            <p className="text-white/30 text-sm mt-2">{t('preorder.checkBack')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10" data-testid="grid-preorder-products">
            {preOrderProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
