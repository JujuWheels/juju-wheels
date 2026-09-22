import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PromoBar } from "@/components/layout/PromoBar";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [pathname] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black flex flex-col font-sans">
      <PromoBar />
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer className="relative z-10" />
    </div>
  );
}
