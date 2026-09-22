import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center">
      <SEO title="Page Not Found" noindex />
      <Card className="w-full max-w-sm mx-4 text-center">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h1 className="text-xl font-bold text-white">{t('notFound.title')}</h1>
          </div>
          <p className="text-sm text-white/60">
            {t('notFound.desc')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
