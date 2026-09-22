import { useEffect } from "react";
import { useLocation } from "wouter";

interface ProductJsonLd {
  name: string;
  description?: string;
  image?: string;
  price?: string;
  currency?: string;
  availability?: boolean;
  brand?: string;
  sku?: string;
  additionalProperty?: Array<{ name: string; value: string }>;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ItemListJsonLd {
  items: { name: string; url: string }[];
}

interface BrandJsonLd {
  name: string;
  url: string;
  description: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  noindex?: boolean;
  type?: "website" | "product";
  image?: string;
  productJsonLd?: ProductJsonLd;
  itemListJsonLd?: ItemListJsonLd;
  brandJsonLd?: BrandJsonLd;
  breadcrumb?: BreadcrumbItem[];
}

export function SEO({ title, description, noindex, type = "website", image, productJsonLd, itemListJsonLd, brandJsonLd, breadcrumb }: SEOProps) {
  const [location] = useLocation();

  useEffect(() => {
    const baseUrl = "https://jujuwheels.com";
    const fullUrl = `${baseUrl}${location}`;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      canonical.href = fullUrl;
    }

    const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
    if (!ogUrl) {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:url");
      meta.content = fullUrl;
      document.head.appendChild(meta);
    } else {
      ogUrl.content = fullUrl;
    }

    if (title) {
      const fullTitle = title.includes("Juju Wheels") ? title : `${title} | Juju Wheels`;
      document.title = fullTitle;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (ogTitle) ogTitle.setAttribute("content", fullTitle);
      if (twTitle) twTitle.setAttribute("content", fullTitle);
    }

    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      const ogDesc = document.querySelector('meta[property="og:description"]');
      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (metaDesc) metaDesc.setAttribute("content", description);
      if (ogDesc) ogDesc.setAttribute("content", description);
      if (twDesc) twDesc.setAttribute("content", description);
    }

    if (image) {
      const ogImage = document.querySelector('meta[property="og:image"]');
      const twImage = document.querySelector('meta[name="twitter:image"]');
      if (ogImage) ogImage.setAttribute("content", image);
      if (twImage) twImage.setAttribute("content", image);
    }

    const ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) ogType.setAttribute("content", type);

    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.name = "robots";
      document.head.appendChild(robotsMeta);
    }
    if (noindex) {
      robotsMeta.content = "noindex, nofollow";
    } else {
      robotsMeta.content = "index, follow";
    }

    // Product JSON-LD
    let jsonLdScript = document.querySelector('script[data-seo-jsonld]') as HTMLScriptElement;
    if (productJsonLd) {
      const additionalProp = productJsonLd.additionalProperty?.length
        ? productJsonLd.additionalProperty.map((p) => ({
            "@type": "PropertyValue",
            name: p.name,
            value: p.value,
          }))
        : undefined;
      const jsonLd: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: productJsonLd.name,
        description: productJsonLd.description,
        image: productJsonLd.image,
        url: fullUrl,
        ...(productJsonLd.sku ? { sku: productJsonLd.sku } : {}),
        brand: productJsonLd.brand ? { "@type": "Brand", name: productJsonLd.brand } : undefined,
        ...(additionalProp ? { additionalProperty: additionalProp } : {}),
        offers: {
          "@type": "Offer",
          price: productJsonLd.price,
          priceCurrency: productJsonLd.currency || "EUR",
          availability: productJsonLd.availability !== false
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: "Juju Wheels" },
        },
      };
      if (!jsonLdScript) {
        jsonLdScript = document.createElement("script");
        jsonLdScript.type = "application/ld+json";
        jsonLdScript.setAttribute("data-seo-jsonld", "true");
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    // ItemList JSON-LD
    let itemListScript = document.querySelector('script[data-seo-itemlist]') as HTMLScriptElement;
    if (itemListJsonLd && itemListJsonLd.items.length > 0) {
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: itemListJsonLd.items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: item.name,
            url: item.url,
          },
        })),
      };
      if (!itemListScript) {
        itemListScript = document.createElement("script");
        itemListScript.type = "application/ld+json";
        itemListScript.setAttribute("data-seo-itemlist", "true");
        document.head.appendChild(itemListScript);
      }
      itemListScript.textContent = JSON.stringify(jsonLd);
    } else if (itemListScript) {
      itemListScript.remove();
    }

    // Brand JSON-LD
    let brandScript = document.querySelector('script[data-seo-brand]') as HTMLScriptElement;
    if (brandJsonLd) {
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Brand",
        name: brandJsonLd.name,
        url: brandJsonLd.url,
        description: brandJsonLd.description,
      };
      if (!brandScript) {
        brandScript = document.createElement("script");
        brandScript.type = "application/ld+json";
        brandScript.setAttribute("data-seo-brand", "true");
        document.head.appendChild(brandScript);
      }
      brandScript.textContent = JSON.stringify(jsonLd);
    } else if (brandScript) {
      brandScript.remove();
    }

    // Breadcrumb JSON-LD
    let breadcrumbScript = document.querySelector('script[data-seo-breadcrumb]') as HTMLScriptElement;
    if (breadcrumb && breadcrumb.length > 0) {
      const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumb.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: item.name,
          item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
        })),
      };
      if (!breadcrumbScript) {
        breadcrumbScript = document.createElement("script");
        breadcrumbScript.type = "application/ld+json";
        breadcrumbScript.setAttribute("data-seo-breadcrumb", "true");
        document.head.appendChild(breadcrumbScript);
      }
      breadcrumbScript.textContent = JSON.stringify(breadcrumbLd);
    } else if (breadcrumbScript) {
      breadcrumbScript.remove();
    }

    return () => {
      // Reset to indexable on unmount so pages without a <SEO> component
      // inherit a safe default rather than losing the tag entirely.
      const meta = document.querySelector('meta[name="robots"]');
      if (meta) meta.setAttribute("content", "index, follow");
      const existingJsonLd = document.querySelector('script[data-seo-jsonld]');
      if (existingJsonLd) existingJsonLd.remove();
      const existingItemList = document.querySelector('script[data-seo-itemlist]');
      if (existingItemList) existingItemList.remove();
      const existingBrand = document.querySelector('script[data-seo-brand]');
      if (existingBrand) existingBrand.remove();
      const existingBreadcrumb = document.querySelector('script[data-seo-breadcrumb]');
      if (existingBreadcrumb) existingBreadcrumb.remove();
    };
  }, [location, title, description, noindex, type, image, productJsonLd, itemListJsonLd, brandJsonLd, breadcrumb]);

  return null;
}
