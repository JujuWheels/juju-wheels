import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";

export default function WheelRebuilding() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background pt-20">
      <SEO
        title="Wheel Rebuilding Service | 3-Piece JDM Wheel Restoration"
        description="Expert 3-piece JDM wheel rebuilding and restoration. Replace lips, barrels, and centres to get your wheels back to perfect condition. Juju Wheels, Netherlands."
      />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-4">
          <span className="text-xs font-tech uppercase tracking-widest text-primary/70">{t('general.services')}</span>
        </div>

        <div className="mb-12 space-y-8">
          <div className="p-8 border border-primary/20 bg-primary/5">
            <h1 className="text-3xl font-display text-white mb-6 uppercase">{t('rebuild.title')}</h1>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              {t('rebuild.desc')}
            </p>

            <h3 className="text-xl font-display text-primary mb-4 uppercase">{t('rebuild.quickSteps')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-4 border border-white/10 bg-black/30">
                <span className="text-primary font-display text-lg">1.</span>
                <h4 className="text-white font-display uppercase text-sm mt-1 mb-1">{t('rebuild.step1Title')}</h4>
                <p className="text-muted-foreground text-xs">{t('rebuild.step1Desc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <span className="text-primary font-display text-lg">2.</span>
                <h4 className="text-white font-display uppercase text-sm mt-1 mb-1">{t('rebuild.step2Title')}</h4>
                <p className="text-muted-foreground text-xs">{t('rebuild.step2Desc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <span className="text-primary font-display text-lg">3.</span>
                <h4 className="text-white font-display uppercase text-sm mt-1 mb-1">{t('rebuild.step3Title')}</h4>
                <p className="text-muted-foreground text-xs">{t('rebuild.step3Desc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <span className="text-primary font-display text-lg">4.</span>
                <h4 className="text-white font-display uppercase text-sm mt-1 mb-1">{t('rebuild.step4Title')}</h4>
                <p className="text-muted-foreground text-xs">{t('rebuild.step4Desc')}</p>
              </div>
            </div>

            <h3 className="text-xl font-display text-primary mb-4 uppercase">{t('rebuild.detailedProcess')}</h3>
            <div className="space-y-6 text-muted-foreground text-sm max-w-3xl mb-8">
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('rebuild.detail1Title')}</h4>
                <p>{t('rebuild.detail1Desc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('rebuild.detail2Title')}</h4>
                <p>{t('rebuild.detail2Desc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('rebuild.detail3Title')}</h4>
                <p>{t('rebuild.detail3Desc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('rebuild.detail4Title')}</h4>
                <p>{t('rebuild.detail4Desc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('rebuild.detail5Title')}</h4>
                <p>{t('rebuild.detail5Desc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('rebuild.detail6Title')}</h4>
                <p>{t('rebuild.detail6Desc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('rebuild.detail7Title')}</h4>
                <p>{t('rebuild.detail7Desc')}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://wa.me/31611601627?text=I%20want%20to%20use%20the%20Wheel%20Rebuilding%20Service!"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-primary text-primary-foreground hover:bg-white hover:text-black font-tech uppercase tracking-widest px-8 rounded-none h-12">
                  {t('rebuild.getQuoteWhatsApp')}
                </Button>
              </a>
              <a
                href="mailto:info@jujuwheels.com"
                className="inline-flex items-center justify-center px-8 h-12 border border-white/20 text-white font-tech uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                {t('rebuild.emailUs')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
