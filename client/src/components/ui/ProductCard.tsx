import { Link } from "wouter";
import { Product, formatPrice, shopifyImageUrl } from "@/lib/shopify";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language";

const BC_RACING_FALLBACKS: Record<string, string> = {
  br: "https://cdn.shopify.com/s/files/1/0787/4242/1828/files/BR_Generic_Image_cb710a09-0173-467d-8a88-b1741d7c6411.jpg",
  v1: "https://cdn.shopify.com/s/files/1/0787/4242/1828/files/V1_Generic_Image_ac86b9a3-b33b-49de-9020-2c73fbb44a5e.jpg",
  generic: "https://cdn.shopify.com/s/files/1/0787/4242/1828/files/BR_Generic_Image_cb710a09-0173-467d-8a88-b1741d7c6411.jpg",
};

function getBcRacingFallback(handle: string): string {
  if (/-v1-|-vs-|-vn-|-va-|-vm-|-vt-|-vh-/.test(handle)) return BC_RACING_FALLBACKS.v1;
  return BC_RACING_FALLBACKS.br;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { title, priceRange, images, handle, availableForSale, compareAtPriceRange } = product;
  const { t } = useLanguage();
  const image = images.edges[0]?.node;
  const price = priceRange.minVariantPrice;
  const compareAt = compareAtPriceRange?.minVariantPrice;
  const isOnSale = compareAt && parseFloat(compareAt.amount) > 0 && parseFloat(compareAt.amount) > parseFloat(price.amount);
  const discountPercent = isOnSale ? Math.round((1 - parseFloat(price.amount) / parseFloat(compareAt!.amount)) * 100) : 0;
  const isPreOrder = product.tags?.some((tag: string) => tag.toLowerCase() === 'pre-order');

  const isBcRacing = handle.startsWith("bc-racing-");
  const fallbackUrl = isBcRacing && !image ? getBcRacingFallback(handle) : null;
  const displayUrl = image?.url ?? fallbackUrl;
  const displayAlt = image?.altText || title;

  return (
    <Link href={`/products/${handle}`} aria-label={`View ${title}`}>
      <div className={cn("group cursor-pointer space-y-4", className)} data-testid={`card-product-${handle}`}>
        <div className="relative aspect-square overflow-hidden bg-white/5 border border-white/5">
          {displayUrl && (
            <img
              src={image ? shopifyImageUrl(displayUrl, 450) : displayUrl}
              srcSet={image ? `${shopifyImageUrl(displayUrl, 260)} 260w, ${shopifyImageUrl(displayUrl, 450)} 450w` : undefined}
              sizes={image ? "(max-width: 768px) 260px, 300px" : undefined}
              alt={displayAlt}
              className={cn("h-full w-full object-contain transition-transform duration-500 group-hover:scale-105", isPreOrder && "contrast-[1.15] brightness-[0.85]")}
              loading="lazy"
              width={450}
              height={450}
            />
          )}
          
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {isOnSale && (
              <span className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1" data-testid={`badge-sale-${handle}`}>
                -{discountPercent}%
              </span>
            )}
            {!availableForSale && (
              <span className="flex items-center gap-1.5 bg-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest px-2 py-1 backdrop-blur-sm" data-testid="badge-sold-out">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" aria-hidden="true" />
                Sold Out
              </span>
            )}
            {availableForSale && (
              <span className="flex items-center gap-1.5 bg-black/60 text-[10px] font-bold uppercase tracking-widest px-2 py-1 backdrop-blur-sm text-emerald-400" data-testid="badge-in-stock">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" aria-hidden="true" />
                {isPreOrder ? t('product.eligiblePreOrder') : t('product.inStock')}
              </span>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block">
            <button className="w-full bg-white text-black font-tech font-bold uppercase tracking-wider py-3 hover:bg-primary transition-colors text-sm" data-testid={`button-view-${handle}`}>
              View Details
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-white font-medium font-display tracking-wide truncate group-hover:text-primary transition-colors text-sm" data-testid={`text-title-${handle}`}>
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <span className={cn("font-tech text-sm", isOnSale ? "text-red-400" : "text-muted-foreground")} data-testid={`text-price-${handle}`}>
              {formatPrice(price)}
            </span>
            {isOnSale && (
              <span className="text-white/40 font-tech text-xs line-through" data-testid={`text-compare-price-${handle}`}>
                {formatPrice(compareAt!)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
