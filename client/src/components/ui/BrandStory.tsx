import { useMemo } from "react";
import { findBrandStory } from "@/lib/brandStories";
import { useLanguage } from "@/lib/language";
import { MapPin, Calendar, Wrench } from "lucide-react";

interface BrandStoryProps {
  productTitle: string;
}

export function BrandStory({ productTitle }: BrandStoryProps) {
  const { t } = useLanguage();

  const match = useMemo(() => findBrandStory(productTitle), [productTitle]);

  if (!match) return null;

  const { brand, model } = match;

  return (
    <section className="w-full border-t border-b border-white/10 bg-gradient-to-b from-black via-white/[0.02] to-black" data-testid="section-brand-story">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">

          <div className="space-y-6">
            {brand.logo && (
              <img
                src={brand.logo}
                alt={`${brand.brand} logo`}
                className="h-12 md:h-16 w-auto object-contain object-left opacity-80"
              />
            )}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-3">{t('brand.heritage')}</p>
              <h3 className="text-2xl md:text-3xl font-display uppercase text-white mb-1">
                {brand.brand}
              </h3>
              <div className="flex items-center gap-4 text-white/40 text-xs font-mono uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary/60" />
                  {t('brand.founded')} {brand.founded}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary/60" />
                  {brand.city}, {brand.country}
                </span>
              </div>
            </div>
            {(() => {
              const sentences = brand.story.match(/[^.!?]+[.!?]+/g) || [];
              const pullQuote = sentences[0]?.trim() || "";
              const rest = brand.story.slice(pullQuote.length).trim();
              return (
                <>
                  {pullQuote && (
                    <blockquote className="border-l-2 border-primary pl-5 py-1" data-testid="text-brand-story-pullquote">
                      <p className="text-xl md:text-2xl italic text-white/80 leading-snug">{pullQuote}</p>
                    </blockquote>
                  )}
                  {rest && (
                    <p className="text-sm text-white/60 leading-relaxed" data-testid="text-brand-story">
                      {rest}
                    </p>
                  )}
                </>
              );
            })()}
            {brand.founders && (
              <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider border-t border-white/5 pt-4">
                {brand.founders}
              </p>
            )}
          </div>

          {model && (
            <div className="space-y-6 md:border-l md:border-white/10 md:pl-20">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-3">
                  {t('brand.aboutModel')}
                </p>
                <h3 className="text-2xl md:text-3xl font-display uppercase text-white mb-1">
                  {model.name}
                </h3>
                <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">{model.era}</span>
              </div>
              <p className="text-sm md:text-base text-white/60 leading-relaxed" data-testid="text-model-story">
                {model.story}
              </p>
              <div className="flex items-center gap-2 text-xs text-white/40 border-t border-white/5 pt-4">
                <Wrench className="w-3.5 h-3.5 text-primary/50" />
                <span className="font-mono uppercase tracking-wider">{t('brand.construction')}: {model.construction}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
