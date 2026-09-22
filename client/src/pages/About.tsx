import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { MessageCircle, Search, ShieldCheck, CheckCircle, Tag, MapPin } from "lucide-react";
import { SEO } from "@/components/SEO";

const WHATSAPP_URL = "https://wa.me/31611601627?text=Hi%20Juju%20Wheels!%20I%27d%20like%20to%20get%20in%20touch.";

const processSteps = [
  { icon: Search, key: "sourced" },
  { icon: ShieldCheck, key: "inspected" },
  { icon: CheckCircle, key: "verified" },
  { icon: Tag, key: "listed" },
];

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="pt-24 pb-16 min-h-screen" data-testid="page-about">
      <SEO
        title="About Juju Wheels | Authentic JDM Wheel Specialists"
        description="Learn how Juju Wheels sources, inspects, and verifies authentic JDM wheels from Japan. Based in Drachten, Netherlands — shipping across Europe."
      />
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="py-16 md:py-24 text-center border-b border-white/10 mb-16">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white uppercase mb-6" data-testid="text-about-hero">
            {t('about.heroTitle')}
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            {t('about.heroSubtitle')}
          </p>
        </div>

        {/* Our Story */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-display text-white uppercase mb-6" data-testid="text-our-story">
            {t('about.storyTitle')}
          </h2>
          <div className="max-w-3xl space-y-4">
            <p className="text-white/70 leading-relaxed">{t('about.storyP1')}</p>
            <p className="text-white/70 leading-relaxed">{t('about.storyP2')}</p>
          </div>
        </section>

        {/* Our Expertise */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-display text-white uppercase mb-6" data-testid="text-expertise">
            {t('about.expertiseTitle')}
          </h2>
          <div className="max-w-3xl space-y-4">
            <p className="text-white/70 leading-relaxed">{t('about.expertiseP1')}</p>
            <p className="text-white/70 leading-relaxed">{t('about.expertiseP2')}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Work", "SSR", "BBS", "Rays", "Enkei", "Weds"].map((brand) => (
              <span
                key={brand}
                className="px-4 py-2 border border-white/10 bg-white/5 text-white font-tech text-sm uppercase tracking-wider hover:border-primary/30 transition-colors"
                data-testid={`badge-brand-${brand.toLowerCase()}`}
              >
                {brand}
              </span>
            ))}
          </div>
        </section>

        {/* Our Process */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-display text-white uppercase mb-10" data-testid="text-process">
            {t('about.processTitle')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {processSteps.map((step, i) => (
              <div
                key={step.key}
                className="border border-white/10 bg-white/5 p-6 flex flex-col items-center text-center gap-4"
                data-testid={`card-process-${i}`}
              >
                <div className="w-12 h-12 flex items-center justify-center border border-primary/30 bg-primary/10">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-primary font-tech text-xs uppercase tracking-widest">{t('about.step')} {i + 1}</span>
                <h3 className="text-white font-display text-sm uppercase">{t(`about.process${step.key.charAt(0).toUpperCase() + step.key.slice(1)}Title`)}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{t(`about.process${step.key.charAt(0).toUpperCase() + step.key.slice(1)}Desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Visit Our Warehouse */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-display text-white uppercase mb-6" data-testid="text-warehouse">
            {t('about.warehouseTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <p className="text-white/70 leading-relaxed">{t('about.warehouseP1')}</p>
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="w-5 h-5" />
                <span className="font-tech text-sm uppercase tracking-wider">{t('about.warehouseLocation')}</span>
              </div>
            </div>
            <div className="aspect-video bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-white/30 font-tech text-sm uppercase tracking-wider">TODO: {t('about.addWarehousePhoto')}</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center border-t border-white/10">
          <h2 className="text-2xl md:text-3xl font-display text-white uppercase mb-4" data-testid="text-about-cta">
            {t('about.ctaTitle')}
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">{t('about.ctaDesc')}</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-white hover:text-black font-tech uppercase tracking-widest text-sm h-14 px-8 rounded-none"
              data-testid="button-about-whatsapp"
            >
              <MessageCircle className="mr-2 w-4 h-4" /> {t('about.ctaButton')}
            </Button>
          </a>
        </section>
      </div>
    </div>
  );
}
