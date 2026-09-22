import { Truck, CheckCircle, MapPin, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { useScrollAnimation, useStaggerChildren } from "@/hooks/use-scroll-animation";

export function TrustStrip() {
  const { t } = useLanguage();
  const bannerAnim = useScrollAnimation("fade-in");
  const { ref: gridRef, isVisible: gridVisible } = useStaggerChildren();

  const items = [
    {
      icon: Truck,
      title: t('trust.worldwideShipping'),
      desc: t('trust.worldwideShippingDesc')
    },
    {
      icon: MapPin,
      title: t('trust.stockDrachten'),
      desc: t('trust.stockDrachtenDesc')
    },
    {
      icon: ShieldCheck,
      title: t('trust.authenticWheels'),
      desc: t('trust.authenticWheelsDesc')
    },
    {
      icon: CheckCircle,
      title: t('trust.expertAdvice'),
      desc: t('trust.expertAdviceDesc')
    }
  ];

  return (
    <>
    <div ref={bannerAnim.ref} className={`bg-primary text-black text-center py-2.5 px-4 ${bannerAnim.className}`}>
      <p className="font-tech uppercase tracking-[0.2em] text-xs md:text-sm font-bold">
        {t('trust.freeShippingBanner')}
      </p>
    </div>
    <div className="bg-white/5 border-y border-white/10">
      <div className="container mx-auto px-4">
        <div
          ref={gridRef}
          className={`grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10 stagger-children${gridVisible ? " stagger-visible" : ""}`}
        >
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center py-6 px-4 group hover:bg-white/5 transition-colors">
              <item.icon className="h-6 w-6 text-primary mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-white font-display text-sm tracking-wider mb-1 uppercase">{item.title}</h3>
              <p className="text-white/50 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
