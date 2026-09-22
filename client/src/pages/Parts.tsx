import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";

interface OverviewItem {
  title: string;
  desc: string;
  href: string;
}

export default function Parts() {
  const { t } = useLanguage();

  const components: OverviewItem[] = [
    { title: t("configurator.title"), desc: t("partsOverview.configuratorDesc"), href: "/parts-configurator" },
    { title: t("nav.outerLips"), desc: t("partsOverview.outerLipsDesc"), href: "/collections/outer-wheel-lips" },
    { title: t("nav.innerBarrels"), desc: t("partsOverview.innerBarrelsDesc"), href: "/collections/inner-barrels" },
    { title: t("nav.stepUpKits"), desc: t("partsOverview.stepUpKitsDesc"), href: "/collections/step-up-wheel-kits" },
    { title: t("nav.assemblyHardware"), desc: t("partsOverview.assemblyHardwareDesc"), href: "/products/wheel-assembly-hardware" },
  ];

  const services: OverviewItem[] = [
    { title: t("nav.spacersAdapters"), desc: t("partsOverview.spacersAdaptersDesc"), href: "/products/custom-made-wheel-spacers-adapters" },
    { title: t("nav.powdercoating"), desc: t("partsOverview.powdercoatingDesc"), href: "/powdercoating" },
    { title: t("nav.wheelRebuildingService"), desc: t("partsOverview.rebuildingDesc"), href: "/wheel-rebuilding" },
    { title: t("nav.ceramicPolishing"), desc: t("partsOverview.ceramicPolishingDesc"), href: "/collections/services" },
  ];

  const renderGrid = (label: string, items: OverviewItem[], testPrefix: string) => (
    <div className="mb-16">
      <h2 className="text-xl font-display text-primary mb-6 uppercase">{label}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group p-6 border border-white/10 bg-black/30 transition-colors",
              "hover:border-primary/40 hover:bg-primary/5 flex flex-col"
            )}
            data-testid={`card-${testPrefix}-${item.href.split("/").pop()}`}
          >
            <h3 className="text-white font-display uppercase text-base mb-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-muted-foreground text-sm flex-1">{item.desc}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-primary font-tech uppercase tracking-widest text-xs">
              {t("partsOverview.viewMore")}
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-20">
      <SEO
        title="Parts & Services | 3-Piece Wheel Components | Juju Wheels"
        description="Overview of all Juju Wheels parts and services: outer lips, inner barrels, step-up kits, assembly hardware, custom spacers, powder coating, wheel rebuilding and ceramic polishing."
      />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <span className="text-xs font-tech uppercase tracking-widest text-primary/70">
            {t("nav.partsServices")}
          </span>
          <h1 className="text-3xl md:text-4xl font-display text-white mt-2 mb-4 uppercase">
            {t("partsOverview.title")}
          </h1>
          <p className="text-muted-foreground max-w-3xl">{t("partsOverview.subtitle")}</p>
        </div>

        {renderGrid(t("partsOverview.componentsLabel"), components, "component")}
        {renderGrid(t("partsOverview.servicesLabel"), services, "service")}
      </div>
    </div>
  );
}
