import { Link } from "wouter";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/lib/language";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48 6.3 6.3 0 001.86-4.49V8.74a8.26 8.26 0 004.84 1.55V6.84a4.84 4.84 0 01-1.12-.15z"/>
    </svg>
  );
}

export function Footer({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <footer className={`bg-background border-t border-white/10 pt-16 pb-8 ${className || ""}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" aria-label="Juju Wheels — Home">
            <img src="/images/logo.webp" alt="Juju Wheels" className="h-16 w-auto mb-3" width={160} height={80} />
          </Link>
          <p className="text-white/70 text-xs font-tech uppercase tracking-[0.2em]">Authentic JDM Wheels — Drachten, NL</p>
        </div>

        <div className="flex justify-center gap-4 mb-12">
          <a href="https://wa.me/31631601627" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 border border-primary/60 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-colors" data-testid="link-whatsapp">
            <WhatsAppIcon className="h-5 w-5" />
          </a>
          <a href="https://www.instagram.com/juju_wheels/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 border border-primary/60 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-colors" data-testid="link-instagram">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="https://www.facebook.com/jujuwheels" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 border border-primary/60 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-colors" data-testid="link-facebook">
            <Facebook className="h-5 w-5" />
          </a>
          <a href="mailto:info@juju-wheels.com" aria-label="Email" className="w-10 h-10 border border-primary/60 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-colors" data-testid="link-email">
            <Mail className="h-5 w-5" />
          </a>
          <a href="https://www.tiktok.com/@jujuwheels" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-10 h-10 border border-primary/60 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-colors" data-testid="link-tiktok">
            <TikTokIcon className="h-5 w-5" />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <h2 className="font-display text-white text-sm uppercase tracking-wider mb-4">{t('footer.shop')}</h2>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="/collections/wheels-for-sale" className="hover:text-primary transition-colors">{t('footer.allWheels')}</Link></li>
              <li><Link href="/collections/outer-wheel-lips" className="hover:text-primary transition-colors">{t('home.outerLips')}</Link></li>
              <li><Link href="/collections/inner-barrels" className="hover:text-primary transition-colors">{t('home.innerBarrels')}</Link></li>
              <li><Link href="/collections/step-up-wheel-kits" className="hover:text-primary transition-colors">{t('home.conversionKits')}</Link></li>
              <li><Link href="/sale" className="hover:text-primary transition-colors">{t('home.onSale')}</Link></li>
              <li><Link href="/stanceparts" className="hover:text-primary transition-colors">StanceParts</Link></li>
              <li><Link href="/bc-racing" className="hover:text-primary transition-colors">BC Racing</Link></li>
              <li><Link href="/collections/all" className="hover:text-primary transition-colors">{t('footer.allProducts')}</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-white text-sm uppercase tracking-wider mb-4">{t('footer.tools')}</h2>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="/fitment-calculator" className="hover:text-primary transition-colors">{t('home.fitmentCalcTitle')}</Link></li>
              <li><Link href="/wheel-spec-calculator" className="hover:text-primary transition-colors">{t('home.specCalcTitle')}</Link></li>
              <li><Link href="/vehicle-fitment" className="hover:text-primary transition-colors">{t('nav.vehicleFitment')}</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-white text-sm uppercase tracking-wider mb-4">{t('footer.about')}</h2>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="/about" className="hover:text-primary transition-colors">{t('nav.about')}</Link></li>
              <li><Link href="/authenticity" className="hover:text-primary transition-colors">{t('nav.authenticity')}</Link></li>
              <li><Link href="/knowledge" className="hover:text-primary transition-colors">{t('nav.knowledge')}</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-white text-sm uppercase tracking-wider mb-4">Juju Wheels</h2>
            <p className="font-bold text-white/90 text-sm mb-2">{t('footer.companyDetails')}</p>
            <ul className="space-y-1 text-xs text-white/50 mb-4">
              <li>De Roef 5</li>
              <li>9206AK Drachten</li>
              <li>Tel: +31631601627</li>
              <li>BTW: NL005278137B68</li>
              <li>KVK: 87587088</li>
            </ul>
            <p className="text-white/50 text-xs">{t('footer.openHours')}</p>
            <p className="text-white/50 text-xs mt-1">{t('footer.weekends')}</p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Juju Wheels. {t('footer.allRightsReserved')}</p>
          <div className="flex gap-6">
            <Link href="/pages/privacy-policy" className="hover:text-white transition-colors">{t('footer.privacyPolicy')}</Link>
            <Link href="/pages/terms-of-service" className="hover:text-white transition-colors">{t('footer.termsOfService')}</Link>
            <Link href="/pages/refund-policy" className="hover:text-white transition-colors">{t('footer.refundPolicy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
