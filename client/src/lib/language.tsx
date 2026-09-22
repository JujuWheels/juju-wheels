import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { translations } from "./translations";

type Lang = "en" | "nl" | "de" | "es" | "fr";

const SUPPORTED_LANGS: Lang[] = ["en", "nl", "de", "es", "fr"];
const STORAGE_KEY = "juju-lang";
const DEFAULT_LANG: Lang = "en";

const NL_COUNTRIES = ["NL", "BE", "SR"];
const DE_COUNTRIES = ["DE", "AT", "CH", "LI"];
const ES_COUNTRIES = [
  "ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC",
  "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY",
];
const FR_COUNTRIES = [
  "FR", "MC", "LU", "SN", "CI", "ML", "BF", "NE", "TD", "GN",
  "BJ", "TG", "CF", "CG", "GA", "DJ", "KM", "MG", "HT",
];

function mapCountryToLang(countryCode: string): Lang {
  if (NL_COUNTRIES.includes(countryCode)) return "nl";
  if (DE_COUNTRIES.includes(countryCode)) return "de";
  if (ES_COUNTRIES.includes(countryCode)) return "es";
  if (FR_COUNTRIES.includes(countryCode)) return "fr";
  return "en";
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored as Lang)) {
      return stored as Lang;
    }
    return DEFAULT_LANG;
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.country_code) {
            const detected = mapCountryToLang(data.country_code);
            setLangState(detected);
            localStorage.setItem(STORAGE_KEY, detected);
          } else {
            localStorage.setItem(STORAGE_KEY, DEFAULT_LANG);
          }
        })
        .catch(() => {
          localStorage.setItem(STORAGE_KEY, DEFAULT_LANG);
        });
    }
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] || entry["en"] || key;
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
