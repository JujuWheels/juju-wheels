import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";

export default function FenderRolling() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background pt-20">
      <SEO
        title="Fender Rolling Service | Juju Wheels"
        description="Professional fender rolling service to fit wider wheels without rubbing. Contact Juju Wheels in Drachten, Netherlands for a quote."
      />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-4">
          <span className="text-xs font-tech uppercase tracking-widest text-primary/70">{t('general.services')}</span>
        </div>

        <div className="mb-12 space-y-8">
          <div className="p-8 border border-primary/20 bg-primary/5">
            <h1 className="text-3xl font-display text-white mb-6 uppercase">{t('fender.title')}</h1>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              {t('fender.desc')}
            </p>

            <h3 className="text-xl font-display text-primary mb-4 uppercase">{t('fender.quickSteps')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="p-4 border border-white/10 bg-black/30">
                <span className="text-primary font-display text-lg">1.</span>
                <h4 className="text-white font-display uppercase text-sm mt-1 mb-1">{t('fender.step1Title')}</h4>
                <p className="text-muted-foreground text-xs">{t('fender.step1Desc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <span className="text-primary font-display text-lg">2.</span>
                <h4 className="text-white font-display uppercase text-sm mt-1 mb-1">{t('fender.step2Title')}</h4>
                <p className="text-muted-foreground text-xs">{t('fender.step2Desc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <span className="text-primary font-display text-lg">3.</span>
                <h4 className="text-white font-display uppercase text-sm mt-1 mb-1">{t('fender.step3Title')}</h4>
                <p className="text-muted-foreground text-xs">{t('fender.step3Desc')}</p>
              </div>
            </div>

            <h3 className="text-xl font-display text-primary mb-4 uppercase">{t('fender.detailedProcess')}</h3>
            <div className="space-y-6 text-muted-foreground text-sm max-w-3xl mb-8">
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('fender.detail1Title')}</h4>
                <p>{t('fender.detail1Desc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('fender.detail2Title')}</h4>
                <p>{t('fender.detail2Desc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('fender.detail3Title')}</h4>
                <p>{t('fender.detail3Desc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('fender.detail4Title')}</h4>
                <p>{t('fender.detail4Desc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('fender.detail5Title')}</h4>
                <p>{t('fender.detail5Desc')}</p>
              </div>
            </div>

            <h3 className="text-xl font-display text-primary mb-4 uppercase">{t('fender.goodToKnow')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-3xl">
              <div className="p-4 border border-white/10 bg-black/30">
                <h4 className="text-white font-display uppercase text-xs mb-2">{t('fender.noCutTitle')}</h4>
                <p className="text-muted-foreground text-xs">{t('fender.noCutDesc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <h4 className="text-white font-display uppercase text-xs mb-2">{t('fender.paintSafeTitle')}</h4>
                <p className="text-muted-foreground text-xs">{t('fender.paintSafeDesc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <h4 className="text-white font-display uppercase text-xs mb-2">{t('fender.whileYouWaitTitle')}</h4>
                <p className="text-muted-foreground text-xs">{t('fender.whileYouWaitDesc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <h4 className="text-white font-display uppercase text-xs mb-2">{t('fender.appointmentTitle')}</h4>
                <p className="text-muted-foreground text-xs">{t('fender.appointmentDesc')}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://wa.me/31611601627?text=I%20want%20to%20book%20the%20Fender%20Rolling%20Service!"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-primary text-primary-foreground hover:bg-white hover:text-black font-tech uppercase tracking-widest px-8 rounded-none h-12">
                  {t('fender.bookWhatsApp')}
                </Button>
              </a>
              <a
                href="mailto:info@jujuwheels.com"
                className="inline-flex items-center justify-center px-8 h-12 border border-white/20 text-white font-tech uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                {t('fender.emailUs')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
