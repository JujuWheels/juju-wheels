import { useQuery } from "@tanstack/react-query";
import { getPageByHandle } from "@/lib/shopify";
import { useRoute } from "wouter";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";
import DOMPurify from "dompurify";

export default function Page() {
  const [, params] = useRoute("/pages/:handle");
  const handle = params?.handle || "";
  const { t } = useLanguage();

  const title = handle.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["page", handle],
    queryFn: () => getPageByHandle(handle),
    enabled: !!handle,
    retry: false,
  });

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <SEO
        title={page?.seo?.title || page?.title || title}
        description={page?.seo?.description || page?.bodySummary?.slice(0, 160) || `${title} — Juju Wheels`}
      />
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8 uppercase text-center" data-testid="text-page-title">
          {page?.title || title}
        </h1>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : page?.body ? (
          <div 
            className="prose prose-invert prose-lg mx-auto text-muted-foreground font-light leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.body) }}
            data-testid="text-page-content"
          />
        ) : handle === "custom-requests" ? (
          <div className="prose prose-invert prose-lg mx-auto text-muted-foreground font-light leading-relaxed">
             <p className="text-xl text-white/90 mb-8">
               {t('custom.lookingForSpecific')}
             </p>
             <div className="my-8 p-6 bg-white/5 border-l-2 border-primary">
                <h3 className="text-white font-display uppercase mb-2">{t('custom.getInstantHelp')}</h3>
                <p className="mb-4">{t('custom.instantHelpDesc')}</p>
                <p className="text-primary font-medium">{t('custom.tapLiveChat')}</p>
             </div>
          </div>
        ) : (
          <div className="prose prose-invert prose-lg mx-auto text-muted-foreground font-light leading-relaxed">
             <p className="text-xl text-white/90 mb-8">
               This is the "{title}" page.
             </p>
             <p>
               {error 
                 ? "Connect your Shopify store to load this page content automatically."
                 : "Content for this page will be loaded from your Shopify store."
               }
             </p>
             <div className="my-8 p-6 bg-white/5 border-l-2 border-primary">
                <h3 className="text-white font-display uppercase mb-2">Key Information</h3>
                <p>Relevant details regarding {title} would be displayed here once your Shopify store is connected.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
