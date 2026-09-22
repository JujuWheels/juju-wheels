import { useQuery } from "@tanstack/react-query";
import { getProducts, type Product, formatPrice } from "@/lib/shopify";
import { ProductCard } from "@/components/ui/ProductCard";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";
import { Loader2, Tag } from "lucide-react";

export default function Sale() {
  const { t } = useLanguage();

  const { data: allProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["products", "all-for-sale-page"],
    queryFn: () => getProducts(100),
  });

  const saleProducts = allProducts ? allProducts.filter((p: Product) => {
    const compareAt = p.compareAtPriceRange?.minVariantPrice;
    const price = p.priceRange.minVariantPrice;
    return compareAt && parseFloat(compareAt.amount) > 0 && parseFloat(compareAt.amount) > parseFloat(price.amount);
  }).sort((a, b) => {
    if (a.availableForSale === b.availableForSale) return 0;
    return a.availableForSale ? -1 : 1;
  }) : [];

  const totalSavings = saleProducts.reduce((acc, p) => {
    const compareAt = p.compareAtPriceRange?.minVariantPrice;
    const price = p.priceRange.minVariantPrice;
    if (compareAt) {
      return acc + (parseFloat(compareAt.amount) - parseFloat(price.amount));
    }
    return acc;
  }, 0);

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <SEO
        title="JDM Wheels on Sale | Discounted Authentic Wheels"
        description="Shop discounted authentic JDM wheels from Work, BBS, SSR, Rays, Enkei and more. Limited stock, verified condition — shipping across Europe from the Netherlands."
      />
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Tag className="w-6 h-6 text-red-500" />
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase" data-testid="text-sale-heading">
              {t('sale.title')}
            </h1>
            <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1">
              Sale
            </span>
          </div>
          <p className="text-muted-foreground max-w-2xl" data-testid="text-sale-subtitle">
            {t('sale.subtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : saleProducts.length === 0 ? (
          <div className="py-24 text-center">
            <Tag className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 font-tech uppercase tracking-wider text-lg" data-testid="text-no-sale">
              {t('sale.noItems')}
            </p>
            <p className="text-white/30 text-sm mt-2">{t('sale.checkBack')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10" data-testid="grid-sale-products">
              {saleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
