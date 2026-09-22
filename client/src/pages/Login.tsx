import { useLanguage } from "@/lib/language";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Shield, Bookmark, Car, Calculator } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Login() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/my-account" />;
  }

  const socialProviders = [
    {
      name: "Google",
      labelKey: "login.continueWithGoogle" as const,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ),
      bgClass: "bg-white hover:bg-gray-100 text-gray-800",
    },
    {
      name: "GitHub",
      labelKey: "login.continueWithGitHub" as const,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      bgClass: "bg-[#24292F] hover:bg-[#32383F] text-white",
    },
    {
      name: "Apple",
      labelKey: "login.continueWithApple" as const,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      ),
      bgClass: "bg-white hover:bg-gray-100 text-black",
    },
    {
      name: "Email",
      labelKey: "login.continueWithEmail" as const,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      ),
      bgClass: "bg-white/10 hover:bg-white/15 text-white border border-white/20",
    },
  ];

  const benefits = [
    { icon: Bookmark, key: "login.benefit1" as const },
    { icon: Car, key: "login.benefit2" as const },
    { icon: Calculator, key: "login.benefit3" as const },
  ];

  return (
    <div className="min-h-screen flex bg-black">
      <SEO title="Login" noindex />
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-black to-black" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E9D355' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 p-12 max-w-lg">
          <div className="mb-8">
            <img src="/images/logo.webp" alt="JUJU WHEELS" className="h-28 w-auto" width={280} height={140} />
          </div>

          <h2 className="text-white/90 text-2xl font-display uppercase tracking-wider mb-4">
            Premium JDM Wheels
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Authentic Japanese wheels sourced directly from Japan. Custom lips, barrels, ceramic polishing, and powdercoating services available.
          </p>

          <div className="space-y-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-white/60 text-sm">{t(b.key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/images/logo.webp" alt="JUJU WHEELS" className="h-24 w-auto" width={240} height={120} />
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-white font-display text-2xl uppercase tracking-widest mb-2" data-testid="text-login-title">
                {t('login.title')}
              </h1>
              <p className="text-white/70 text-sm" data-testid="text-login-subtitle">
                {t('login.subtitle')}
              </p>
            </div>

            <div className="space-y-3">
              {socialProviders.map((provider) => (
                <a
                  key={provider.name}
                  href="/api/login"
                  className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 text-sm font-medium transition-all ${provider.bgClass}`}
                  data-testid={`button-login-${provider.name.toLowerCase()}`}
                >
                  {provider.icon}
                  {t(provider.labelKey)}
                </a>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-white/20 text-xs">
                {t('login.termsNote')}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 border-t border-white/10" />
              <Shield className="w-3.5 h-3.5 text-white/20" />
              <div className="flex-1 border-t border-white/10" />
            </div>

            <div className="mt-4 text-center">
              <p className="text-white/30 text-xs">
                {t('login.secureNote')}
              </p>
            </div>
          </div>

          <div className="mt-6 text-center lg:hidden">
            <div className="space-y-3">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3 justify-center">
                  <b.icon className="w-4 h-4 text-primary/60" />
                  <span className="text-white/40 text-xs">{t(b.key)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
