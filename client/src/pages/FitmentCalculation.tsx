import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";

export default function FitmentCalculation() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background pt-20">
      <SEO
        title="Wheel Fitment Calculation Service | Juju Wheels"
        description="Professional wheel fitment calculation and advice. Get expert guidance on offset, PCD, and spacer requirements for your JDM wheel setup."
      />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-4">
          <span className="text-xs font-tech uppercase tracking-widest text-primary/70">{t('general.services')}</span>
        </div>

        <div className="mb-12 space-y-8">
          <div className="p-8 border border-primary/20 bg-primary/5">
            <h1 className="text-3xl font-display text-white mb-6 uppercase">{t('fitCalc.title')}</h1>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              {t('fitCalc.desc')}
            </p>

            <h3 className="text-xl font-display text-primary mb-4 uppercase">{t('fitCalc.whatWeCalcTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div className="p-4 border border-white/10 bg-black/30">
                <h4 className="text-white font-display uppercase text-sm mb-2">{t('fitCalc.pokeFlush')}</h4>
                <p className="text-muted-foreground text-xs">{t('fitCalc.pokeFlushDesc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <h4 className="text-white font-display uppercase text-sm mb-2">{t('fitCalc.tyreStretch')}</h4>
                <p className="text-muted-foreground text-xs">{t('fitCalc.tyreStretchDesc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <h4 className="text-white font-display uppercase text-sm mb-2">{t('fitCalc.rideHeightSpeedo')}</h4>
                <p className="text-muted-foreground text-xs">{t('fitCalc.rideHeightSpeedoDesc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <h4 className="text-white font-display uppercase text-sm mb-2">{t('fitCalc.fenderWork')}</h4>
                <p className="text-muted-foreground text-xs">{t('fitCalc.fenderWorkDesc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <h4 className="text-white font-display uppercase text-sm mb-2">{t('fitCalc.camber')}</h4>
                <p className="text-muted-foreground text-xs">{t('fitCalc.camberDesc')}</p>
              </div>
              <div className="p-4 border border-white/10 bg-black/30">
                <h4 className="text-white font-display uppercase text-sm mb-2">{t('fitCalc.pcdHubBore')}</h4>
                <p className="text-muted-foreground text-xs">{t('fitCalc.pcdHubBoreDesc')}</p>
              </div>
            </div>

            <h3 className="text-xl font-display text-primary mb-4 uppercase">{t('fitCalc.howItWorks')}</h3>
            <div className="space-y-6 text-muted-foreground text-sm max-w-3xl mb-8">
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('fitCalc.share')}</h4>
                <p>{t('fitCalc.shareDesc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('fitCalc.goals')}</h4>
                <p>{t('fitCalc.goalsDesc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('fitCalc.runNumbers')}</h4>
                <p>{t('fitCalc.runNumbersDesc')}</p>
              </div>
              <div>
                <h4 className="text-white font-tech uppercase tracking-wider text-xs mb-2">{t('fitCalc.report')}</h4>
                <p>{t('fitCalc.reportDesc')}</p>
              </div>
            </div>

            <div className="p-6 border border-white/10 bg-black/30 mb-8 max-w-3xl">
              <h4 className="text-white font-display uppercase text-sm mb-3">{t('fitCalc.tryCalculators')}</h4>
              <p className="text-muted-foreground text-xs mb-4">{t('fitCalc.tryCalculatorsDesc')}</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/fitment-calculator" aria-label="Open Wheel Fitment Calculator">
                  <Button variant="outline" className="font-tech uppercase tracking-widest text-xs rounded-none border-white/20 text-white hover:bg-white/10">
                    {t('fitCalc.fitmentCalculator')}
                  </Button>
                </Link>
                <Link href="/wheel-spec-calculator" aria-label="Open 3-Piece Wheel Spec Calculator">
                  <Button variant="outline" className="font-tech uppercase tracking-widest text-xs rounded-none border-white/20 text-white hover:bg-white/10">
                    {t('fitCalc.specCalculator')}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-6 border border-white/10 bg-black/30 mb-8 max-w-3xl">
              <h4 className="text-white font-display uppercase text-sm mb-3">{t('fitCalc.visitInHouse')}</h4>
              <p className="text-muted-foreground text-xs mb-2">{t('fitCalc.visitInHouseDesc')}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://wa.me/31611601627?text=I%20want%20to%20book%20a%20Fitment%20Calculation%20appointment!"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-primary text-primary-foreground hover:bg-white hover:text-black font-tech uppercase tracking-widest px-8 rounded-none h-12">
                  {t('fitCalc.bookAppointment')}
                </Button>
              </a>
              <a
                href="mailto:info@jujuwheels.com"
                className="inline-flex items-center justify-center px-8 h-12 border border-white/20 text-white font-tech uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                {t('fitCalc.emailUs')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
