import { Product } from "@/lib/shopify";
import { ProductCard } from "./ProductCard";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language";
import { useStaggerChildren } from "@/hooks/use-scroll-animation";
import { TextReveal } from "@/components/ui/TextReveal";

interface CollectionGridProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
}

export function CollectionGrid({ title, subtitle, products, viewAllLink }: CollectionGridProps) {
  const { t } = useLanguage();
  const { ref: gridRef, isVisible: gridVisible } = useStaggerChildren();

  return (
    <section className="py-10 md:py-14 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <TextReveal
              text={title}
              className="text-3xl md:text-4xl font-display font-bold text-white mb-2"
              subtitle={subtitle}
              subtitleClassName="text-muted-foreground"
              wordDelay={50}
            />
          </div>
          {viewAllLink && (
            <Link href={viewAllLink} aria-label={`${t('general.viewAll')} ${title}`}>
              <span className="hidden md:inline-flex items-center gap-2 text-primary hover:text-white transition-colors font-tech uppercase tracking-widest text-sm cursor-pointer">
                {t('general.viewAll')} <span aria-hidden="true">&rarr;</span>
              </span>
            </Link>
          )}
        </div>

        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div
            ref={gridRef}
            className={`flex gap-6 stagger-children${gridVisible ? " stagger-visible" : ""}`}
            style={{ minWidth: 'max-content' }}
          >
            {products.map((product) => (
              <div key={product.id} className="w-[260px] flex-shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {viewAllLink && (
           <div className="mt-8 text-center md:hidden">
             <Link href={viewAllLink} aria-label={`${t('general.viewAll')} ${title}`}>
               <button className="w-full border border-white/20 text-white font-tech uppercase tracking-widest py-3 hover:bg-white/10 transition-colors">
                 {t('general.viewAll')}
               </button>
             </Link>
           </div>
        )}
      </div>
    </section>
  );
}
