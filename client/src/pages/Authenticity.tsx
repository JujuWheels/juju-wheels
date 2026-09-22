import { Fingerprint, Shield, Hash, Search, MessageCircle, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const WHATSAPP_URL = "https://wa.me/31611601627?text=Hi%20Juju%20Wheels!%20I%20have%20a%20question%20about%20wheel%20authenticity.";

const steps = [
  { icon: Fingerprint, key: "heatstamp" },
  { icon: Shield, key: "forgedCast" },
  { icon: Hash, key: "serialNumber" },
  { icon: Search, key: "condition" },
];

export default function Authenticity() {
  const { t } = useLanguage();

  const comparisonRows = [
    { feature: t('authenticity.compHeatstamp'), original: t('authenticity.compHeatstampOriginal'), replica: t('authenticity.compHeatstampReplica') },
    { feature: t('authenticity.compWeight'), original: t('authenticity.compWeightOriginal'), replica: t('authenticity.compWeightReplica') },
    { feature: t('authenticity.compFinish'), original: t('authenticity.compFinishOriginal'), replica: t('authenticity.compFinishReplica') },
    { feature: t('authenticity.compBarrelSeam'), original: t('authenticity.compBarrelSeamOriginal'), replica: t('authenticity.compBarrelSeamReplica') },
    { feature: t('authenticity.compSerial'), original: t('authenticity.compSerialOriginal'), replica: t('authenticity.compSerialReplica') },
  ];

  return (
    <div className="pt-24 pb-16 min-h-screen" data-testid="page-authenticity">
      <SEO
        title="Authenticity Guarantee | Verified JDM Wheels"
        description="Every wheel sold by Juju Wheels is inspected for heat stamps, serial numbers, forged vs cast construction, and overall condition. Buy genuine JDM wheels with confidence."
      />
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="py-16 md:py-24 text-center border-b border-white/10 mb-16">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white uppercase mb-6" data-testid="text-authenticity-hero">
            {t('authenticity.heroTitle')}
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            {t('authenticity.heroSubtitle')}
          </p>
        </div>

        {/* Section 1: Why Authenticity Matters */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-display text-white uppercase mb-6" data-testid="text-why-matters">
            {t('authenticity.whyTitle')}
          </h2>
          <div className="max-w-3xl">
            <p className="text-white/70 leading-relaxed mb-4">{t('authenticity.whyP1')}</p>
            <p className="text-white/70 leading-relaxed">{t('authenticity.whyP2')}</p>
          </div>
        </section>

        {/* Section 2: 4-Step Verification Process */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-display text-white uppercase mb-10" data-testid="text-verification-process">
            {t('authenticity.processTitle')}
          </h2>
          <div className="space-y-12">
            {steps.map((step, i) => (
              <div key={step.key} data-testid={`section-step-${i}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 flex items-center justify-center border border-primary/30 bg-primary/10 shrink-0">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary font-tech text-xs uppercase tracking-widest">{t('authenticity.step')} {i + 1}</span>
                    <h3 className="text-xl font-display text-white uppercase">{t(`authenticity.${step.key}Title`)}</h3>
                  </div>
                </div>
                <p className="text-white/70 leading-relaxed">{t(`authenticity.${step.key}Desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Replica vs Original */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-display text-white uppercase mb-10" data-testid="text-comparison">
            {t('authenticity.comparisonTitle')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-white/10" data-testid="table-comparison">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left p-4 font-tech text-xs uppercase tracking-widest text-white/60 border-b border-white/10">{t('authenticity.feature')}</th>
                  <th className="text-left p-4 font-tech text-xs uppercase tracking-widest text-green-400 border-b border-white/10">
                    <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t('authenticity.original')}</span>
                  </th>
                  <th className="text-left p-4 font-tech text-xs uppercase tracking-widest text-red-400 border-b border-white/10">
                    <span className="flex items-center gap-2"><XCircle className="w-4 h-4" /> {t('authenticity.replica')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-tech text-sm">{row.feature}</td>
                    <td className="p-4 text-white/70 text-sm">{row.original}</td>
                    <td className="p-4 text-white/70 text-sm">{row.replica}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Our Commitment */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-display text-white uppercase mb-6" data-testid="text-commitment">
            {t('authenticity.commitmentTitle')}
          </h2>
          <div className="max-w-3xl">
            <p className="text-white/70 leading-relaxed mb-4">{t('authenticity.commitmentP1')}</p>
            <p className="text-white/70 leading-relaxed">{t('authenticity.commitmentP2')}</p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center border-t border-white/10">
          <h2 className="text-2xl md:text-3xl font-display text-white uppercase mb-4" data-testid="text-authenticity-cta">
            {t('authenticity.ctaTitle')}
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">{t('authenticity.ctaDesc')}</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-white hover:text-black font-tech uppercase tracking-widest text-sm h-14 px-8 rounded-none"
              data-testid="button-authenticity-whatsapp"
            >
              <MessageCircle className="mr-2 w-4 h-4" /> {t('authenticity.ctaButton')}
            </Button>
          </a>
        </section>
      </div>
    </div>
  );
}
