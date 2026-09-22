import { Fingerprint, Shield, Hash, Search, ArrowRight, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const WHATSAPP_URL = "https://wa.me/31611601627?text=Hi%20Juju%20Wheels!%20I%20have%20a%20question%20about%20wheel%20authenticity.";

export function AuthenticityBlock() {
  const { t } = useLanguage();
  const anim = useScrollAnimation("fade-in");
  const ctaAnim = useScrollAnimation("blur-up", { delay: 200 });

  const points = [
    { icon: Fingerprint, title: t('auth.heatstamp'),    short: t('auth.heatstampShort')    || 'Heat Stamp' },
    { icon: Shield,      title: t('auth.forgedCast'),   short: t('auth.forgedCastShort')   || 'Forged & Cast' },
    { icon: Hash,        title: t('auth.serialNumber'), short: t('auth.serialNumberShort') || 'Serial No.' },
    { icon: Search,      title: t('auth.condition'),    short: t('auth.conditionShort')    || 'Inspected' },
  ];

  return (
    <section className="py-24 md:py-32 bg-black border-t border-white/10" data-testid="section-authenticity-block">
      <div className="container mx-auto px-4">
        {/* title row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <span className="text-primary font-tech uppercase tracking-[0.3em] text-xs mb-3 block">
              {t('auth.badgeLabel') || 'Authenticity Guarantee'}
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase">
              {t('auth.title')}
            </h2>
          </div>
          <div ref={ctaAnim.ref} className={`flex flex-wrap gap-3 ${ctaAnim.className}`}>
            <Link href="/authenticity" aria-label={t('auth.learnMore') + ' — Authenticity Guarantee'}>
              <Button
                size="sm"
                className="bg-primary text-black hover:bg-white hover:text-black font-tech uppercase tracking-widest text-xs h-10 px-6 rounded-none"
                data-testid="button-auth-learn-more"
              >
                {t('auth.learnMore')} <ArrowRight className="ml-2 w-3.5 h-3.5" />
              </Button>
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 font-tech uppercase tracking-widest text-xs h-10 px-6 rounded-none"
                data-testid="button-auth-expert-advice"
              >
                <MessageCircle className="mr-2 w-3.5 h-3.5" /> {t('auth.getExpertAdvice')}
              </Button>
            </a>
          </div>
        </div>

        {/* horizontal icon strip */}
        <div
          ref={anim.ref}
          className={`grid grid-cols-2 md:grid-cols-4 border border-white/10 divide-x divide-y md:divide-y-0 divide-white/10 ${anim.className}`}
        >
          {points.map((point, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center gap-3 px-6 py-8 hover:bg-white/[0.03] transition-colors group"
              data-testid={`card-auth-point-${i}`}
            >
              <div className="w-11 h-11 flex items-center justify-center border border-primary/30 bg-primary/10 group-hover:border-primary/60 transition-colors">
                <point.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-display text-sm uppercase tracking-wider mb-1">{point.short}</h3>
                <p className="text-white/35 text-[11px] font-tech uppercase tracking-wider leading-relaxed">
                  {point.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
