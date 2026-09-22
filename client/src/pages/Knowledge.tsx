import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Cog, Disc3, Gauge, Layers3, ShieldCheck, Ruler, Sparkles, Wrench } from "lucide-react";

function OffsetDiagram() {
  return (
    <svg viewBox="0 0 400 200" className="w-full max-w-md mx-auto my-6" aria-label="Offset diagram">
      {/* Wheel outline */}
      <rect x="50" y="20" width="300" height="160" rx="0" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      {/* Center line (hub mounting face) */}
      <line x1="200" y1="10" x2="200" y2="190" stroke="#E9D355" strokeWidth="2" strokeDasharray="6,4" />
      <text x="200" y="198" textAnchor="middle" fill="#E9D355" fontSize="10" fontFamily="monospace">HUB FACE</text>
      {/* Positive offset indicator */}
      <line x1="250" y1="40" x2="250" y2="80" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="200" y1="60" x2="250" y2="60" stroke="#4ade80" strokeWidth="2" />
      <polygon points="248,56 256,60 248,64" fill="#4ade80" />
      <text x="225" y="52" textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="monospace">+ET</text>
      <text x="225" y="92" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">POSITIVE</text>
      {/* Negative offset indicator */}
      <line x1="150" y1="120" x2="150" y2="160" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="200" y1="140" x2="150" y2="140" stroke="#f87171" strokeWidth="2" />
      <polygon points="152,136 144,140 152,144" fill="#f87171" />
      <text x="175" y="132" textAnchor="middle" fill="#f87171" fontSize="10" fontFamily="monospace">-ET</text>
      <text x="175" y="172" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">NEGATIVE</text>
      {/* Wheel center label */}
      <text x="200" y="110" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">WHEEL CENTER</text>
    </svg>
  );
}

const articles = [
  { id: "replica", icon: ShieldCheck, keyPrefix: "knowledge.replica" },
  { id: "offset", icon: Ruler, keyPrefix: "knowledge.offset" },
  { id: "rebuild", icon: Wrench, keyPrefix: "knowledge.rebuild" },
];

const hardwareTopics = [
  { id: "hardware", icon: Cog, keyPrefix: "knowledge.guideHardware" },
  { id: "components", icon: Disc3, keyPrefix: "knowledge.guideComponents" },
  { id: "measuring", icon: Gauge, keyPrefix: "knowledge.guideMeasuring" },
  { id: "construction", icon: Wrench, keyPrefix: "knowledge.guideConstruction" },
  { id: "configurations", icon: Layers3, keyPrefix: "knowledge.guideConfigurations" },
  { id: "maintenance", icon: Sparkles, keyPrefix: "knowledge.guideMaintenance" },
  { id: "orientation", icon: Disc3, keyPrefix: "knowledge.guideOrientation" },
  { id: "lips", icon: Layers3, keyPrefix: "knowledge.guideLips" },
  { id: "materials", icon: Cog, keyPrefix: "knowledge.guideMaterials" },
];

export default function Knowledge() {
  const { t } = useLanguage();

  return (
    <div className="pt-24 pb-16 min-h-screen" data-testid="page-knowledge">
      <SEO
        title="JDM Wheel Knowledge Hub | Offset, PCD & Fitment Explained"
        description="Learn everything about JDM wheels — offset, PCD, bore size, 3-piece construction, lips, barrels and fitment. Expert guides from Juju Wheels."
      />
      <div className="container mx-auto px-4">
        <div className="py-16 md:py-24 text-center border-b border-white/10 mb-12">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white uppercase mb-6" data-testid="text-knowledge-hero">
            {t('knowledge.heroTitle')}
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            {t('knowledge.heroSubtitle')}
          </p>
        </div>

        <Accordion type="multiple" className="space-y-4">
          {articles.map((article) => (
            <AccordionItem
              key={article.id}
              value={article.id}
              className="border border-white/10 bg-white/5 px-6"
              data-testid={`accordion-${article.id}`}
            >
              <AccordionTrigger className="text-white font-display text-lg md:text-xl uppercase tracking-wider hover:no-underline hover:text-primary py-6">
                <span className="flex items-center gap-3">
                  <article.icon className="w-5 h-5 text-primary shrink-0" />
                  {t(`${article.keyPrefix}Title`)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-white/70 leading-relaxed pb-6">
                {article.id === "replica" && (
                  <div className="space-y-4">
                    <p>{t('knowledge.replicaP1')}</p>
                    <p>{t('knowledge.replicaP2')}</p>
                    <ul className="list-disc ml-6 space-y-2 text-white/60">
                      <li>{t('knowledge.replicaSign1')}</li>
                      <li>{t('knowledge.replicaSign2')}</li>
                      <li>{t('knowledge.replicaSign3')}</li>
                      <li>{t('knowledge.replicaSign4')}</li>
                      <li>{t('knowledge.replicaSign5')}</li>
                    </ul>
                  </div>
                )}
                {article.id === "offset" && (
                  <div className="space-y-4">
                    <p>{t('knowledge.offsetP1')}</p>
                    <p>{t('knowledge.offsetP2')}</p>
                    <OffsetDiagram />
                    <p>{t('knowledge.offsetP3')}</p>
                  </div>
                )}

                {article.id === "rebuild" && (
                  <div className="space-y-4">
                    <p>{t('knowledge.rebuildP1')}</p>
                    <ol className="list-decimal ml-6 space-y-3 text-white/60">
                      <li><span className="text-white font-tech">{t('knowledge.rebuildStep1Title')}:</span> {t('knowledge.rebuildStep1Desc')}</li>
                      <li><span className="text-white font-tech">{t('knowledge.rebuildStep2Title')}:</span> {t('knowledge.rebuildStep2Desc')}</li>
                      <li><span className="text-white font-tech">{t('knowledge.rebuildStep3Title')}:</span> {t('knowledge.rebuildStep3Desc')}</li>
                      <li><span className="text-white font-tech">{t('knowledge.rebuildStep4Title')}:</span> {t('knowledge.rebuildStep4Desc')}</li>
                      <li><span className="text-white font-tech">{t('knowledge.rebuildStep5Title')}:</span> {t('knowledge.rebuildStep5Desc')}</li>
                    </ol>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-16 mb-8 border-t border-white/10 pt-12">
          <span className="text-xs font-tech uppercase tracking-widest text-primary/70">
            {t("knowledge.guideEyebrow")}
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-display text-white uppercase">
            {t("knowledge.guideTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-white/60">
            {t("knowledge.guideIntro")}
          </p>
        </div>

        <Accordion type="multiple" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hardwareTopics.map((topic) => (
            <AccordionItem
              key={topic.id}
              value={topic.id}
              className="border border-white/10 bg-white/5 px-6"
              data-testid={`accordion-guide-${topic.id}`}
            >
              <AccordionTrigger className="text-left text-white font-display text-base md:text-lg uppercase tracking-wider hover:no-underline hover:text-primary py-6">
                <span className="flex items-center gap-3">
                  <topic.icon className="w-5 h-5 text-primary shrink-0" />
                  {t(`${topic.keyPrefix}Title`)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <p className="text-white/70 leading-relaxed">
                  {t(`${topic.keyPrefix}Summary`)}
                </p>
                <p className="mt-4 text-xs font-tech uppercase tracking-widest text-primary/80">
                  {t(`${topic.keyPrefix}Keywords`)}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
