import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";

const STORAGE_KEY = "juju-promo-bar-dismissed";
const PROMO_H = 36; // px — must match h-9

export function PromoBar() {
  const [visible, setVisible] = useState(false);

  // Read sessionStorage once on mount; set CSS var so Navbar can offset itself
  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
      document.documentElement.style.setProperty("--promo-h", `${PROMO_H}px`);
    } else {
      document.documentElement.style.setProperty("--promo-h", "0px");
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    document.documentElement.style.setProperty("--promo-h", "0px");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[60] bg-primary text-black flex items-center justify-center shrink-0"
      style={{ top: 0, height: PROMO_H }}
    >
      <p className="font-tech uppercase tracking-widest text-[10px] font-bold text-center whitespace-nowrap overflow-hidden text-ellipsis px-10">
        <span className="mr-3">SALE</span>
        <span className="opacity-50 mr-3">·</span>
        19&quot; Chrome Spinners
        <span className="mx-2 opacity-50">·</span>
        <span className="mr-3">€350</span>
        <span className="opacity-50 mr-3">·</span>
        <Link
          href="/products/chrome-wheel-spinners"
          className="underline underline-offset-2 hover:opacity-70 transition-opacity"
        >
          Shop Now
        </Link>
      </p>

      <button
        onClick={dismiss}
        aria-label="Dismiss promotion"
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
