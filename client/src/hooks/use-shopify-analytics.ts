import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const COOKIE_DURATION = 365 * 24 * 60 * 60 * 1000;
const SESSION_DURATION = 30 * 60 * 1000;

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value};path=/;max-age=${Math.floor(maxAge / 1000)};SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? match[1] : null;
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateCookie(name: string, duration: number): string {
  let value = getCookie(name);
  if (!value) {
    value = generateUUID();
    setCookie(name, value, duration);
  }
  return value;
}

function getUniqToken(): string {
  return getOrCreateCookie("_shopify_y", COOKIE_DURATION);
}

function getVisitToken(): string {
  return getOrCreateCookie("_shopify_s", SESSION_DURATION);
}

interface AnalyticsConfig {
  shopId: string;
  domain: string;
}

let configPromise: Promise<AnalyticsConfig> | null = null;

function fetchConfig(): Promise<AnalyticsConfig> {
  if (!configPromise) {
    configPromise = fetch("/api/shopify-analytics/config")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .catch(() => ({ shopId: "", domain: "" }));
  }
  return configPromise;
}

async function sendPageView(url: string, referrer: string) {
  const config = await fetchConfig();
  if (!config.shopId) return;

  const uniqToken = getUniqToken();
  const visitToken = getVisitToken();
  setCookie("_shopify_s", visitToken, SESSION_DURATION);

  const event = {
    schema_id: "trekkie_storefront_page_view/1.4",
    payload: {
      shopId: parseInt(config.shopId, 10),
      isMerchantRequest: false,
      hydrogenSubchannelId: "0",
      isPersistentCookie: true,
      uniqToken,
      visitToken,
      microSessionId: generateUUID(),
      microSessionCount: 1,
      url,
      path: new URL(url).pathname,
      search: new URL(url).search,
      referrer,
      title: document.title,
      clientTimestamp: new Date().toISOString(),
      navigationApi: "spa",
      navigationTarget: url,
      shopDomain: config.domain,
    },
  };

  try {
    await fetch("/api/shopify-analytics/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: [event] }),
    });
  } catch {}
}

export function useShopifyAnalytics() {
  const [location] = useLocation();
  const prevPath = useRef(location);
  const initialSent = useRef(false);

  useEffect(() => {
    if (!initialSent.current) {
      initialSent.current = true;
      sendPageView(window.location.href, document.referrer);
      return;
    }

    if (location !== prevPath.current) {
      const referrer = `${window.location.origin}${prevPath.current}`;
      prevPath.current = location;
      sendPageView(window.location.href, referrer);
    }
  }, [location]);
}
