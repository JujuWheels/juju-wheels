import { useQuery } from "@tanstack/react-query";
import { getProductByHandle, formatPrice, shopifyImageUrl, type Product } from "@/lib/shopify";
import { useRoute } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Truck, Package, Info, ShieldCheck, Loader2, Eye, Sparkles, Car, Search } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/lib/language";
import WheelVisualizer from "@/components/WheelVisualizer";
import { AuthenticityBlock } from "@/components/ui/AuthenticityBlock";
import { FitmentChecker } from "@/components/ui/FitmentChecker";
import { SEO } from "@/components/SEO";
import { BrandStory } from "@/components/ui/BrandStory";
import { findBrandStory } from "@/lib/brandStories";
import DOMPurify from "dompurify";
import {
  formatWheelOffset,
  formatWheelWidth,
  parseWheelSpecs,
  type WheelSpecs,
} from "@/lib/wheelSpecs";

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'a', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'blockquote', 'pre', 'code', 'hr', 'sub', 'sup'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  });
}

function parseDescription(html: string) {
  const clean = sanitizeHtml(html);
  const div = document.createElement("div");
  div.innerHTML = clean;
  const paragraphs = Array.from(div.querySelectorAll("p"));

  const intro: string[] = [];
  const specs: string[] = [];
  const whyJuju: string[] = [];
  const extras: string[] = [];

  let section: "intro" | "specs" | "why" | "extras" = "intro";

  for (const p of paragraphs) {
    const text = p.textContent?.trim() || "";
    // Decode HTML entities for text processing
    const divTemp = document.createElement("div");
    divTemp.innerHTML = p.innerHTML;
    const decodedHtml = divTemp.innerHTML;
    const innerHtml = p.innerHTML;

    if (/instagram|@juju/i.test(text)) continue;

    if (/specs:/i.test(text)) {
      section = "specs";
      const lines = innerHtml.split(/<br\s*\/?>/gi).map(l => l.replace(/<[^>]*>/g, "").trim()).filter(Boolean);
      for (const line of lines) {
        if (/specs:/i.test(line) && line.replace(/specs:/i, "").trim() === "") continue;
        const clean = line.replace(/^[✅🔥💰👉🔧✨🔩📦\s]+/, "").trim();
        // Only include core wheel specs
        if (clean && /inch|J|ET|PCD/i.test(clean) && !/tire|trade|€|price/i.test(clean)) {
          specs.push(clean);
        }
      }
      continue;
    }

    if (/why juju/i.test(text)) {
      section = "why";
      const lines = innerHtml.split(/<br\s*\/?>/gi).map(l => l.replace(/<[^>]*>/g, "").trim()).filter(Boolean);
      for (const line of lines) {
        if (/why juju/i.test(line)) continue;
        const clean = line.replace(/^[✅🔥💰👉🔧✨🔩📦\s]+/, "").trim();
        if (clean) whyJuju.push(clean);
      }
      continue;
    }

    if (section === "intro") {
      const clean = text.replace(/^🔥\s*/, "").replace(/\s*🔥$/, "").replace(/<img[^>]*>/gi, "").trim();
      if (clean) intro.push(clean);
    } else if (section === "specs") {
      const lines = innerHtml.split(/<br\s*\/?>/gi).map(l => l.replace(/<[^>]*>/g, "").trim()).filter(Boolean);
      for (const line of lines) {
        const clean = line.replace(/^[✅🔥💰👉🔧✨🔩📦\s]+/, "").trim();
        // Only include core wheel specs
        if (clean && /inch|J|ET|PCD/i.test(clean) && !/tire|trade|€|price/i.test(clean)) {
          specs.push(clean);
        }
      }
    }
  }

  return { intro, specs, whyJuju, extras };
}

// ──── BC Racing title parser ────────────────────────────────────────────────
// New format (~93%): "BC Racing BR Series, Toyota Supra A90 2020+ 8/6kg.mm, Coilovers (BH-20-BR)"
// Old format (~7%):  "Toyota Supra BC Racing Coilover Kit BR"
function parseBcRacingTitle(title: string): {
  series: string | null;
  carInfo: string | null;
  springRate: string | null;
  productSku: string | null;
} {
  const seriesMatch = title.match(/^BC Racing\s+(\w+)\s+Series,\s*/i);
  if (seriesMatch) {
    const series = seriesMatch[1];
    const rest = title.slice(seriesMatch[0].length);
    const skuMatch = rest.match(/\(([^)]+)\)\s*$/);
    const productSku = skuMatch ? skuMatch[1] : null;
    // Remove ", Coilovers (...)" suffix
    const withoutSuffix = rest.replace(/,\s*Coilovers?\s*(?:\([^)]+\))?\s*$/i, "").trim();
    // Extract spring rate like "8/6kg.mm" or "6/4 kg.mm"
    const springMatch = withoutSuffix.match(/\s+(\d+\/\d+\s*kg\.?mm)\s*$/i);
    const springRate = springMatch
      ? springMatch[1].replace(/kg\.?mm/i, "kg/mm")
      : null;
    const carInfo = withoutSuffix.replace(/\s+\d+\/\d+\s*kg\.?mm\s*$/i, "").trim();
    return { series, carInfo: carInfo || null, springRate, productSku };
  }
  // Old format
  const oldFmt = title.match(/^(.+?)\s+BC Racing\s+Coilover\s+Kit\s+(\w+)\s*$/i);
  if (oldFmt) {
    return {
      series: oldFmt[2] || null,
      carInfo: oldFmt[1]?.trim() || null,
      springRate: null,
      productSku: null,
    };
  }
  return { series: null, carInfo: null, springRate: null, productSku: null };
}

function cleanDescriptionHtml(html: string): string {
  let cleaned = sanitizeHtml(html);
  cleaned = cleaned.replace(/<img[^>]*>/gi, "");
  cleaned = cleaned.replace(/[✅🔥💰👉🔧✨🔩📦☑️✔️]/g, "");
  cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, "");
  const lines = cleaned.split(/\n/).filter(l => !/instagram|@juju/i.test(l));
  return lines.join("\n").trim();
}

function wheelDescriptionCopyHtml(html: string): string {
  const root = document.createElement("div");
  root.innerHTML = cleanDescriptionHtml(html);

  root.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  root.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6").forEach((block) => {
    block.append("\n");
  });

  const rawLines = (root.textContent || "")
    .replace(/\b(Why Juju|trade-in possible)\b/gi, "\n$1")
    .split(/\n+/);
  const copyLines: string[] = [];
  let inSpecs = false;

  for (const rawLine of rawLines) {
    let line = rawLine
      .replace(/^[✅🔥💰👉🔧✨🔩📦☑️✔️\s]+/, "")
      .trim();
    if (!line || /instagram|@juju/i.test(line)) continue;

    if (/^(?:specs|specifications?)\s*:/i.test(line)) {
      inSpecs = true;
      line = line.replace(/^(?:specs|specifications?)\s*:\s*/i, "").trim();
      if (!line) continue;
    }
    if (/^why juju\b/i.test(line)) inSpecs = false;

    const isWheelSpecLine =
      /\bpcd\s*(?:centerlock|universal|(?:[3-8]\s*\/\s*)?[3-8]\s*x\s*\d)/i.test(line) ||
      /\b(?:front|rear)\s*:\s*(?:1[3-9]|2[0-2])\s*x\s*\d/i.test(line) ||
      /\b(?:1[3-9]|2[0-2])\s*x\s*\d{1,2}(?:[.,]\d+)?\s*j?\s*(?:et|[+-]\d)/i.test(line) ||
      (inSpecs &&
        (/\b(?:1[3-9]|2[0-2])\s*(?:inch|["″])/i.test(line) ||
          /\b\d{1,2}(?:[.,]\d+)?\s*j\b/i.test(line) ||
          /\bet\s*[+-]?\s*\d{1,3}\b/i.test(line)));

    if (!isWheelSpecLine) copyLines.push(line);
  }

  const output = document.createElement("div");
  for (const line of copyLines) {
    const paragraph = document.createElement("p");
    paragraph.textContent = line;
    output.append(paragraph);
  }
  return sanitizeHtml(output.innerHTML);
}

function WheelSpecsPanel({ specs }: { specs: WheelSpecs }) {
  const formatOffsetValue = (value: number | null) =>
    value === null ? "—" : `${value > 0 ? "+" : ""}${value}`;
  const hasAnySpec =
    specs.diameter !== null ||
    specs.widthFront !== null ||
    specs.widthUnassigned.length > 0 ||
    specs.offsetFront !== null ||
    specs.offsetShared !== null ||
    specs.offsetUnassigned.length > 0 ||
    specs.pcd !== null;

  if (!hasAnySpec) return null;

  return (
    <div className="space-y-8" data-testid="wheel-specifications">
      <div className="relative border border-white/10 bg-black/40 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        />
        <div className="relative z-10">
          <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
            <div className="h-[2px] w-3 bg-primary" />
            <h4 className="text-[10px] font-tech uppercase tracking-[0.3em] text-primary">
              Specifications
            </h4>
          </div>

          {specs.isStaggered ? (
            <div>
              <div className="grid grid-cols-2 border-b border-white/10">
                <div className="p-5 border-r border-white/10">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Diameter</span>
                  <span className="text-4xl font-display text-white leading-none">
                    {specs.diameter ?? "—"}
                    {specs.diameter !== null && <span className="text-base text-primary ml-1">"</span>}
                  </span>
                </div>
                <div className="p-5">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Bolt Pattern</span>
                  <span className="text-4xl font-display text-white leading-none">{specs.pcd ?? "—"}</span>
                </div>
              </div>
              {(specs.widthFront !== null ||
                specs.widthRear !== null ||
                specs.offsetFront !== null ||
                specs.offsetRear !== null) && (
                <div className="grid grid-cols-2 border-b border-white/10">
                  {([
                    ["Front", specs.widthFront, specs.offsetFront],
                    ["Rear", specs.widthRear, specs.offsetRear],
                  ] as const).map(([label, width, offset]) => (
                    <div key={label} className={`p-5 ${label === "Front" ? "border-r border-white/10" : ""}`}>
                      <span className="text-[9px] font-tech uppercase tracking-wider text-primary block mb-3">{label}</span>
                      <div className="flex items-end gap-5">
                        <div>
                          <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-1">Width</span>
                          <span className="text-3xl font-display text-white leading-none">
                            {width ?? "—"}
                            {width !== null && <span className="text-base text-primary ml-0.5">J</span>}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-1">Offset</span>
                          <span className="text-3xl font-display text-white leading-none">
                            {formatOffsetValue(offset)}
                            {offset !== null && <span className="text-base text-primary ml-0.5">ET</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(specs.widthUnassigned.length > 0 || specs.offsetUnassigned.length > 0) && (
                <div className="px-5 py-4 border-t border-white/10">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">
                    Listed specifications
                  </span>
                  <span className="text-sm font-mono text-white">
                    {[
                      formatWheelWidth(null, null, specs.widthUnassigned),
                      formatWheelOffset(null, null, null, specs.offsetUnassigned),
                    ].filter(Boolean).join(" · ")} (axle assignment not specified)
                  </span>
                </div>
              )}
              {specs.offsetShared !== null && (
                <div className="px-5 py-3 border-t border-white/10">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 mr-3">
                    Listed offset
                  </span>
                  <span className="text-sm font-mono text-white">
                    {formatWheelOffset(null, null, specs.offsetShared)} (axle assignment not specified)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2">
              {[
                { label: "Diameter", value: specs.diameter === null ? null : `${specs.diameter}"` },
                { label: "Width", value: formatWheelWidth(specs.widthFront, specs.widthRear, specs.widthUnassigned) },
                { label: "Bolt Pattern", value: specs.pcd },
                { label: "Offset", value: formatWheelOffset(specs.offsetFront, specs.offsetRear, specs.offsetShared, specs.offsetUnassigned) },
              ].map((cell, index) => (
                <div
                  key={cell.label}
                  className={`p-5 ${index % 2 === 0 ? "border-r" : ""} ${index < 2 ? "border-b" : ""} border-white/10`}
                >
                  <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">{cell.label}</span>
                  <span className="text-4xl font-display text-white leading-none">{cell.value ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductDescription({
  descriptionHtml,
  description,
  wheelSpecs,
}: {
  descriptionHtml?: string;
  description?: string;
  wheelSpecs?: WheelSpecs | null;
}) {
  if (wheelSpecs) {
    const panel = <WheelSpecsPanel specs={wheelSpecs} />;
    const hasAnySpec =
      wheelSpecs.diameter !== null ||
      wheelSpecs.widthFront !== null ||
      wheelSpecs.widthUnassigned.length > 0 ||
      wheelSpecs.offsetFront !== null ||
      wheelSpecs.offsetShared !== null ||
      wheelSpecs.offsetUnassigned.length > 0 ||
      wheelSpecs.pcd !== null;
    if (hasAnySpec) {
      const copyHtml = descriptionHtml
        ? wheelDescriptionCopyHtml(descriptionHtml)
        : "";
      const hasCopy = copyHtml.length > 0 || Boolean(description?.trim());

      return (
        <div className="space-y-8" data-testid="text-product-description">
          {panel}
          {hasCopy && (
            <div id="product-details" className="relative border border-white/10 bg-black/40 p-6 overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }}
              />
              <div className="relative z-10">
                <div className="mb-6">
                  <h4 className="text-[10px] font-tech uppercase tracking-[0.3em] text-primary mb-1">
                    Product Details
                  </h4>
                  <div className="h-[1px] w-12 bg-primary" />
                </div>
                {copyHtml ? (
                  <div
                    className="product-description text-sm text-white/70 leading-relaxed space-y-3 [&_p]:mb-2"
                    dangerouslySetInnerHTML={{ __html: copyHtml }}
                  />
                ) : (
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  let parsed: ReturnType<typeof parseDescription> | null = null;
  let fallbackHtml: string | null = null;

  try {
    if (descriptionHtml) {
      parsed = parseDescription(descriptionHtml);
      if (!parsed || parsed.specs.length === 0) {
        fallbackHtml = cleanDescriptionHtml(descriptionHtml);
      }
    }
  } catch {
    if (descriptionHtml) {
      fallbackHtml = cleanDescriptionHtml(descriptionHtml);
    }
  }

  if (!parsed && !fallbackHtml) return null;

  if (!parsed || parsed.specs.length === 0) {
    const rawText = (fallbackHtml ? fallbackHtml.replace(/<[^>]*>/g, ' ') : '') + ' ' + (description || '');

    const fbWheelDimension = rawText.match(/\b(\d{2})\s*[xX×]\s*(\d{1,2}(?:[,.]\d+)?)\s*(?:[Jj]\b)?/);
    const fbInchMatch = rawText.match(/(\d+)\s*inch/i) || fbWheelDimension;
    const fbInch = fbInchMatch ? fbInchMatch[1] : null;
    const fbPcdLabeled = rawText.match(/PCD[:\s]*(\d+\s*[xX]\s*[\d.]+)/i);
    let fbPcdRaw = "--";
    if (fbPcdLabeled) {
      fbPcdRaw = fbPcdLabeled[1];
    } else {
      const fbPcdGeneric = rawText.match(/\b([3-8]\s*[xX]\s*\d{2,3}(?:\.\d+)?)\b/);
      if (fbPcdGeneric) fbPcdRaw = fbPcdGeneric[1];
    }

    const fbNormalizeJ = (v: string) => v.replace(",", ".").replace(/\s/g, "").toUpperCase();

    let fbJFront = "--";
    let fbJRear = "--";
    const fbJStaggeredInline = rawText.match(/(\d+[,.]?\d*)\s*[Jj]\s*\(?\s*front\s*\)?/i);
    const fbJStaggeredInlineR = rawText.match(/(\d+[,.]?\d*)\s*[Jj]\s*\(?\s*rear\s*\)?/i);
    const fbJBulletFront = rawText.match(/Front:\s*\d+x(\d+[,.]?\d*)\s*[Jj]/i);
    const fbJBulletRear = rawText.match(/Rear:\s*\d+x(\d+[,.]?\d*)\s*[Jj]/i);
    const fbJTwoAfterPipe = rawText.match(/inch\s*\|?\s*(\d+[,.]?\d*)\s*[Jj]\s+(\d+[,.]?\d*)\s*[Jj]\b/i);

    const fbJetPairs = Array.from(rawText.matchAll(/(\d+[,.]?\d*)\s*[Jj]?\s*(?:et|ET)\s*(-?\d+)/gi));

    if (fbJStaggeredInline && fbJStaggeredInlineR) {
      fbJFront = fbNormalizeJ(fbJStaggeredInline[1] + "J");
      fbJRear = fbNormalizeJ(fbJStaggeredInlineR[1] + "J");
    } else if (fbJBulletFront && fbJBulletRear) {
      fbJFront = fbNormalizeJ(fbJBulletFront[1] + "J");
      fbJRear = fbNormalizeJ(fbJBulletRear[1] + "J");
    } else if (fbJTwoAfterPipe) {
      fbJFront = fbNormalizeJ(fbJTwoAfterPipe[1] + "J");
      fbJRear = fbNormalizeJ(fbJTwoAfterPipe[2] + "J");
    } else if (fbJetPairs.length >= 2) {
      fbJFront = fbNormalizeJ(fbJetPairs[0][1] + "J");
      fbJRear = fbNormalizeJ(fbJetPairs[1][1] + "J");
    } else if (fbJetPairs.length === 1) {
      fbJFront = fbNormalizeJ(fbJetPairs[0][1] + "J");
      fbJRear = fbJFront;
    } else {
      // Try slash-separated J values: e.g. "8.5J / 9.5J"
      const fbJSlash = rawText.match(/(\d+[,.]?\d*)\s*[Jj]\s*[\/\-]\s*(\d+[,.]?\d*)\s*[Jj]/i);
      if (fbJSlash) {
        fbJFront = fbNormalizeJ(fbJSlash[1] + "J");
        fbJRear = fbNormalizeJ(fbJSlash[2] + "J");
      } else {
        // Collect all J values; if two distinct values found, smaller=front, larger=rear
        const allFbJMatches = Array.from(rawText.matchAll(/(\d+[,.]?\d*)\s*[Jj]\b/gi));
        const allFbJValues = allFbJMatches.map(m => fbNormalizeJ(m[1] + "J"));
        const uniqueFbJValues = Array.from(new Set(allFbJValues));
        if (uniqueFbJValues.length >= 2) {
          const nums = uniqueFbJValues.map(v => parseFloat(v.replace(/[Jj]/, ""))).sort((a, b) => a - b);
          fbJFront = fbNormalizeJ(nums[0] + "J");
          fbJRear = fbNormalizeJ(nums[nums.length - 1] + "J");
        } else if (uniqueFbJValues.length === 1) {
          fbJFront = uniqueFbJValues[0];
          fbJRear = fbJFront;
        } else {
          const pipeWidth = rawText.match(/inch\s*\|\s*(\d+[,.]?\d*)/i);
          if (pipeWidth) {
            fbJFront = fbNormalizeJ(pipeWidth[1] + "J");
            fbJRear = fbJFront;
          } else if (fbWheelDimension) {
            // Common compact square-set format: "17x9 +22 all around"
            fbJFront = fbNormalizeJ(fbWheelDimension[2] + "J");
            fbJRear = fbJFront;
          }
        }
      }
    }
    const fbIsStaggeredJ = fbJFront !== fbJRear && fbJRear !== "--";

    let fbEtFront = "--";
    let fbEtRear = "--";
    const fbEtStaggeredInline = rawText.match(/ET\s*(-?\d+)\s*\(?\s*front\s*\)?/i);
    const fbEtStaggeredInlineR = rawText.match(/ET\s*(-?\d+)\s*\(?\s*rear\s*\)?/i);
    const fbEtSlash = rawText.match(/ET\s*(-?\d+)\s*\/\s*(-?\d+)/i);
    const fbEtBulletFront = rawText.match(/Front:.*?ET\s*(-?\d+)/i);
    const fbEtBulletRear = rawText.match(/Rear:.*?ET\s*(-?\d+)/i);
    const fbEtFrontLabel = rawText.match(/ET\s*(-?\d+)\s*\(?\s*front\s*\)?[^)]*?(-?\d+)\s*\(?\s*rear\s*\)?/i);

    if (fbEtStaggeredInline && fbEtStaggeredInlineR) {
      fbEtFront = "ET" + fbEtStaggeredInline[1];
      fbEtRear = "ET" + fbEtStaggeredInlineR[1];
    } else if (fbEtFrontLabel) {
      fbEtFront = "ET" + fbEtFrontLabel[1];
      fbEtRear = "ET" + fbEtFrontLabel[2];
    } else if (fbEtBulletFront && fbEtBulletRear) {
      fbEtFront = "ET" + fbEtBulletFront[1];
      fbEtRear = "ET" + fbEtBulletRear[1];
    } else if (fbEtSlash) {
      fbEtFront = "ET" + fbEtSlash[1];
      fbEtRear = "ET" + fbEtSlash[2];
    } else if (fbJetPairs.length >= 2) {
      fbEtFront = "ET" + fbJetPairs[0][2];
      fbEtRear = "ET" + fbJetPairs[1][2];
    } else {
      const singleET = rawText.match(/ET\s*(-?\d+)/i);
      if (singleET) {
        fbEtFront = "ET" + singleET[1];
        fbEtRear = fbEtFront;
      } else if (fbWheelDimension) {
        // Offset is often written directly after the size, e.g. "17x9 +22".
        const compactOffset = rawText.match(
          /\b\d{2}\s*[xX×]\s*\d{1,2}(?:[,.]\d+)?\s*(?:[Jj]\s*)?([+-]\s*\d{1,3})\b/
        );
        if (compactOffset) {
          const normalizedOffset = compactOffset[1].replace(/\s/g, "");
          fbEtFront = "ET" + normalizedOffset;
          fbEtRear = fbEtFront;
        }
      }
    }
    const fbIsStaggeredET = fbEtFront !== fbEtRear && fbEtRear !== "--";
    const fbIsStaggered = fbIsStaggeredJ || fbIsStaggeredET;

    const hasFallbackSpecs = fbInch && fbJFront !== "--";

    if (!hasFallbackSpecs) {
      if (!fallbackHtml) return null;
      return (
        <div className="space-y-4" data-testid="text-product-description">
          <div className="relative border border-white/10 bg-black/40 p-6 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                 style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="relative z-10">
              <div className="mb-6">
                <h4 className="text-[10px] font-tech uppercase tracking-[0.3em] text-primary mb-1">Product Details</h4>
                <div className="h-[1px] w-12 bg-primary"></div>
              </div>
              <div
                className="product-description text-sm text-white/70 leading-relaxed space-y-3 [&_strong]:text-white [&_strong]:font-tech [&_strong]:uppercase [&_strong]:tracking-wider [&_strong]:text-xs [&_ul]:space-y-1 [&_ul]:ml-4 [&_li]:list-disc [&_li]:text-white/60 [&_p]:mb-2 [&_br]:hidden"
                dangerouslySetInnerHTML={{ __html: fallbackHtml }}
              />
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">Juju Wheels</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8" data-testid="text-product-description">
        <div className="relative border border-white/10 bg-black/40 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="relative z-10">
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
              <div className="h-[2px] w-3 bg-primary"></div>
              <h4 className="text-[10px] font-tech uppercase tracking-[0.3em] text-primary">Specifications</h4>
            </div>
            {fbIsStaggered ? (
              <div>
                <div className="grid grid-cols-2 border-b border-white/10">
                  <div className="p-5 border-r border-white/10">
                    <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Diameter</span>
                    <span className="text-4xl font-display text-white leading-none">{fbInch}<span className="text-base text-primary ml-1">"</span></span>
                  </div>
                  <div className="p-5">
                    <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Bolt Pattern</span>
                    <span className="text-4xl font-display text-white leading-none">{fbPcdRaw}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-white/10">
                  <div className="p-5 border-r border-white/10">
                    <span className="text-[9px] font-tech uppercase tracking-wider text-primary block mb-3">Front</span>
                    <div className="flex items-end gap-5">
                      <div>
                        <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-1">Width</span>
                        <span className="text-3xl font-display text-white leading-none">{fbJFront.replace(/J/i, "")}<span className="text-base text-primary ml-0.5">J</span></span>
                      </div>
                      <div>
                        <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-1">Offset</span>
                        <span className="text-3xl font-display text-white leading-none">{fbEtFront.replace(/ET/i, "").trim()}<span className="text-base text-primary ml-0.5">ET</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <span className="text-[9px] font-tech uppercase tracking-wider text-primary block mb-3">Rear</span>
                    <div className="flex items-end gap-5">
                      <div>
                        <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-1">Width</span>
                        <span className="text-3xl font-display text-white leading-none">{fbJRear.replace(/J/i, "")}<span className="text-base text-primary ml-0.5">J</span></span>
                      </div>
                      <div>
                        <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-1">Offset</span>
                        <span className="text-3xl font-display text-white leading-none">{fbEtRear.replace(/ET/i, "").trim()}<span className="text-base text-primary ml-0.5">ET</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2">
                <div className="p-5 border-r border-b border-white/10">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Diameter</span>
                  <span className="text-4xl font-display text-white leading-none">{fbInch}<span className="text-base text-primary ml-1">"</span></span>
                </div>
                <div className="p-5 border-b border-white/10">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Width</span>
                  <span className="text-4xl font-display text-white leading-none">{fbJFront.replace(/J/i, "")}<span className="text-base text-primary ml-1">J</span></span>
                </div>
                <div className="p-5 border-r border-white/10">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Bolt Pattern</span>
                  <span className="text-4xl font-display text-white leading-none">{fbPcdRaw}</span>
                </div>
                <div className="p-5">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Offset</span>
                  <span className="text-4xl font-display text-white leading-none">{fbEtFront.replace(/ET/i, "").trim()}<span className="text-base text-primary ml-1">ET</span></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Extract values for the schematic
  const inch = parsed.specs.find(s => /inch/i.test(s))?.match(/(\d+)\s*inch/i)?.[1] || "--";
  const pcdRaw = parsed.specs.find(s => /PCD/i.test(s))?.match(/(\d+\s*x\s*[\d.]+)/i)?.[1] || "--";

  const allSpecText = parsed.specs.join(" ");
  const descText = description || "";
  const combinedText = allSpecText + " " + descText;

  const normalizeJ = (v: string) => v.replace(",", ".").replace(/\s/g, "").toUpperCase();

  let jFront = "--";
  let jRear = "--";
  const jStaggeredInline = combinedText.match(/(\d+[,.]?\d*)\s*[Jj]\s*\(?\s*front\s*\)?/i);
  const jStaggeredInlineR = combinedText.match(/(\d+[,.]?\d*)\s*[Jj]\s*\(?\s*rear\s*\)?/i);
  const jBulletFront = combinedText.match(/Front:\s*\d+x(\d+[,.]?\d*)\s*[Jj]/i);
  const jBulletRear = combinedText.match(/Rear:\s*\d+x(\d+[,.]?\d*)\s*[Jj]/i);

  const jTwoAfterPipe = combinedText.match(/inch\s*\|?\s*(\d+[,.]?\d*)\s*[Jj]\s+(\d+[,.]?\d*)\s*[Jj]\b/i);

  const jetPairs = Array.from(combinedText.matchAll(/(\d+[,.]?\d*)\s*[Jj]?\s*(?:et|ET)\s*(-?\d+)/gi));

  if (jStaggeredInline && jStaggeredInlineR) {
    jFront = normalizeJ(jStaggeredInline[1] + "J");
    jRear = normalizeJ(jStaggeredInlineR[1] + "J");
  } else if (jBulletFront && jBulletRear) {
    jFront = normalizeJ(jBulletFront[1] + "J");
    jRear = normalizeJ(jBulletRear[1] + "J");
  } else if (jTwoAfterPipe) {
    jFront = normalizeJ(jTwoAfterPipe[1] + "J");
    jRear = normalizeJ(jTwoAfterPipe[2] + "J");
  } else if (jetPairs.length >= 2) {
    jFront = normalizeJ(jetPairs[0][1] + "J");
    jRear = normalizeJ(jetPairs[1][1] + "J");
  } else if (jetPairs.length === 1) {
    jFront = normalizeJ(jetPairs[0][1] + "J");
    jRear = jFront;
  } else {
    // Try slash-separated J values: e.g. "8.5J / 9.5J"
    const jSlash = combinedText.match(/(\d+[,.]?\d*)\s*[Jj]\s*[\/\-]\s*(\d+[,.]?\d*)\s*[Jj]/i);
    if (jSlash) {
      jFront = normalizeJ(jSlash[1] + "J");
      jRear = normalizeJ(jSlash[2] + "J");
    } else {
      // Collect all J values; if two distinct values found, smaller=front, larger=rear
      const allJMatches = Array.from(combinedText.matchAll(/(\d+[,.]?\d*)\s*[Jj]\b/gi));
      const allJValues = allJMatches.map(m => normalizeJ(m[1] + "J"));
      const uniqueJValues = Array.from(new Set(allJValues));
      if (uniqueJValues.length >= 2) {
        const nums = uniqueJValues.map(v => parseFloat(v.replace(/[Jj]/, ""))).sort((a, b) => a - b);
        jFront = normalizeJ(nums[0] + "J");
        jRear = normalizeJ(nums[nums.length - 1] + "J");
      } else if (uniqueJValues.length === 1) {
        jFront = uniqueJValues[0];
        jRear = jFront;
      } else {
        const pipeWidth = combinedText.match(/inch\s*\|\s*(\d+[,.]?\d*)/i);
        if (pipeWidth) {
          jFront = normalizeJ(pipeWidth[1] + "J");
          jRear = jFront;
        }
      }
    }
  }
  const isStaggeredJ = jFront !== jRear && jRear !== "--";

  let etFront = "--";
  let etRear = "--";
  const etStaggeredInline = combinedText.match(/ET\s*(\d+)\s*\(?\s*front\s*\)?/i);
  const etStaggeredInlineR = combinedText.match(/ET\s*(\d+)\s*\(?\s*rear\s*\)?/i);
  const etSlash = combinedText.match(/ET\s*(\d+)\s*\/\s*(\d+)/i);
  const etBulletFront = combinedText.match(/Front:.*?ET\s*(\d+)/i);
  const etBulletRear = combinedText.match(/Rear:.*?ET\s*(\d+)/i);

  const etFrontLabel = combinedText.match(/ET\s*(\d+)\s*\(?\s*front\s*\)?[^)]*?(\d+)\s*\(?\s*rear\s*\)?/i);

  if (etStaggeredInline && etStaggeredInlineR) {
    etFront = "ET" + etStaggeredInline[1];
    etRear = "ET" + etStaggeredInlineR[1];
  } else if (etFrontLabel) {
    etFront = "ET" + etFrontLabel[1];
    etRear = "ET" + etFrontLabel[2];
  } else if (etBulletFront && etBulletRear) {
    etFront = "ET" + etBulletFront[1];
    etRear = "ET" + etBulletRear[1];
  } else if (etSlash) {
    etFront = "ET" + etSlash[1];
    etRear = "ET" + etSlash[2];
  } else if (jetPairs.length >= 2) {
    etFront = "ET" + jetPairs[0][2];
    etRear = "ET" + jetPairs[1][2];
  } else {
    const singleET = combinedText.match(/ET\s*(\d+)/i);
    if (singleET) {
      etFront = "ET" + singleET[1];
      etRear = etFront;
    }
  }
  const isStaggeredET = etFront !== etRear && etRear !== "--";
  const isStaggered = isStaggeredJ || isStaggeredET;

  return (
    <div className="space-y-8" data-testid="text-product-description">
      <div className="relative border border-white/10 bg-black/40 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="relative z-10">
          <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
            <div className="h-[2px] w-3 bg-primary"></div>
            <h4 className="text-[10px] font-tech uppercase tracking-[0.3em] text-primary">Specifications</h4>
          </div>

          {isStaggered ? (
            <div>
              <div className="grid grid-cols-2 border-b border-white/10">
                <div className="p-5 border-r border-white/10">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Diameter</span>
                  <span className="text-4xl font-display text-white leading-none">{inch}<span className="text-base text-primary ml-1">"</span></span>
                </div>
                <div className="p-5">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Bolt Pattern</span>
                  <span className="text-4xl font-display text-white leading-none">{pcdRaw}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 border-b border-white/10">
                <div className="p-5 border-r border-white/10">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-primary block mb-3">Front</span>
                  <div className="flex items-end gap-5">
                    <div>
                      <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-1">Width</span>
                      <span className="text-3xl font-display text-white leading-none">{jFront.replace(/J/i, "")}<span className="text-base text-primary ml-0.5">J</span></span>
                    </div>
                    <div>
                      <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-1">Offset</span>
                      <span className="text-3xl font-display text-white leading-none">{etFront.replace(/ET/i, "").trim()}<span className="text-base text-primary ml-0.5">ET</span></span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <span className="text-[9px] font-tech uppercase tracking-wider text-primary block mb-3">Rear</span>
                  <div className="flex items-end gap-5">
                    <div>
                      <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-1">Width</span>
                      <span className="text-3xl font-display text-white leading-none">{jRear.replace(/J/i, "")}<span className="text-base text-primary ml-0.5">J</span></span>
                    </div>
                    <div>
                      <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-1">Offset</span>
                      <span className="text-3xl font-display text-white leading-none">{etRear.replace(/ET/i, "").trim()}<span className="text-base text-primary ml-0.5">ET</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2">
              <div className="p-5 border-r border-b border-white/10">
                <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Diameter</span>
                <span className="text-4xl font-display text-white leading-none">{inch}<span className="text-base text-primary ml-1">"</span></span>
              </div>
              <div className="p-5 border-b border-white/10">
                <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Width</span>
                <span className="text-4xl font-display text-white leading-none">{jFront.replace(/J/i, "")}<span className="text-base text-primary ml-1">J</span></span>
              </div>
              <div className="p-5 border-r border-white/10">
                <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Bolt Pattern</span>
                <span className="text-4xl font-display text-white leading-none">{pcdRaw}</span>
              </div>
              <div className="p-5">
                <span className="text-[9px] font-tech uppercase tracking-wider text-white/40 block mb-2">Offset</span>
                <span className="text-4xl font-display text-white leading-none">{etFront.replace(/ET/i, "").trim()}<span className="text-base text-primary ml-1">ET</span></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full List for anything not caught in schematic */}
      <div className="grid grid-cols-1 gap-2">
        {parsed.specs.map((spec, i) => {
          // If it's already in the schematic, we can skip or show subtle
          const isSchematicSpec = /inch|J|ET|PCD/i.test(spec);
          if (isSchematicSpec) return null;
          
          return (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/5 border-l-2 border-primary/50">
              <span className="text-[10px] font-mono text-white/60">{spec}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProductPage() {
  const [, params] = useRoute("/products/:handle");
  const handle = params?.handle || "";
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [customerNote, setCustomerNote] = useState("");
  const [spacerConfig, setSpacerConfig] = useState({
    pcdWheel: "",
    pcdHub: "",
    pcdHubCustom: "",
    pcdWheelCustom: "",
    centerBoreWheel: "",
    centerBoreHub: "",
    threadHub: "",
    threadWheel: "",
    fixingType: "",
    fixingTypeWheel: "",
    thickness: "",
    noteCar: "",
    noteWheels: "",
  });
  const [spacerVehicleLookup, setSpacerVehicleLookup] = useState(false);
  const [svMakes, setSvMakes] = useState<{ slug: string; name: string }[]>([]);
  const [svModels, setSvModels] = useState<{ slug: string; name: string }[]>([]);
  const [svYears, setSvYears] = useState<{ slug: number; name: number }[]>([]);
  const [svMods, setSvMods] = useState<{ slug: string; name: string }[]>([]);
  const [svMake, setSvMake] = useState("");
  const [svModel, setSvModel] = useState("");
  const [svYear, setSvYear] = useState("");
  const [svMod, setSvMod] = useState("");
  const [svLoading, setSvLoading] = useState("");
  const [svApplied, setSvApplied] = useState(false);

  const [refinishingOption, setRefinishingOption] = useState("");
  const [powdercoatColor, setPowdercoatColor] = useState("");
  const [customColorText, setCustomColorText] = useState("");
  const [lipMode, setLipMode] = useState<"none" | "front" | "rear" | "all_same" | "all_diff">("none");
  const [lipFrontSize, setLipFrontSize] = useState("");
  const [lipRearSize, setLipRearSize] = useState("");
  const [currentOuterLip, setCurrentOuterLip] = useState(2.0);
  const [mountingStyle, setMountingStyle] = useState<"sandwich" | "front" | "rear">("sandwich");
  const [lipPolish, setLipPolish] = useState(false);
  const { addItem, isUpdating } = useCart();
  const { t } = useLanguage();

  const { data: product, isLoading, error } = useQuery<Product | null>({
    queryKey: ["product", handle],
    queryFn: () => getProductByHandle(handle),
    enabled: !!handle,
  });

  const wheelSpecs = useMemo(
    () =>
      product
        ? parseWheelSpecs({
            title: product.title,
            description: product.description,
          })
        : null,
    [product],
  );

  const parsedWheelSpecsEarly = useMemo(() => {
    if (!product || !wheelSpecs) return null;
    const productTagsLocal = (product.tags || []).map((t: string) => t.toLowerCase());
    const isMultiPieceLocal = productTagsLocal.some((tag: string) => /multi[- ]?piece|2[- ]?piece|3[- ]?piece/.test(tag));
    if (!isMultiPieceLocal) return null;
    return wheelSpecs;
  }, [product, wheelSpecs]);

  const quickWheelSpecs = useMemo(() => {
    if (!product) return null;
    const productColHandles = product.collections?.edges?.map((e: any) => e.node.handle) || [];
    const WHEEL_COLS = ['15-inch-wheels', '15-inch-wheels-copy', '16-inch-wheels-copy', '17-inch-wheels-copy', '18-inch-wheels-copy', '19-inch-wheels-copy', 'wheels-for-sale'];
    const isWheelProduct = productColHandles.some((h: string) => WHEEL_COLS.includes(h));
    if (!isWheelProduct || !wheelSpecs) return null;
    const width = formatWheelWidth(
      wheelSpecs.widthFront,
      wheelSpecs.widthRear,
      wheelSpecs.widthUnassigned,
    );
    const et = formatWheelOffset(
      wheelSpecs.offsetFront,
      wheelSpecs.offsetRear,
      wheelSpecs.offsetShared,
      wheelSpecs.offsetUnassigned,
    );
    if (!wheelSpecs.diameter && !wheelSpecs.pcd && !width && !et) return null;
    return {
      diameter: wheelSpecs.diameter,
      pcd: wheelSpecs.pcd,
      width,
      et,
    };
  }, [product, wheelSpecs]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 gap-4">
        <p className="text-white font-display text-2xl uppercase" data-testid="text-product-error">{t('product.notFound')}</p>
        <p className="text-muted-foreground text-sm">
          {error ? t('product.couldNotLoad') : t('product.doesNotExist')}
        </p>
      </div>
    );
  }

  const BC_RACING_FALLBACKS: Record<string, string> = {
    v1: "https://cdn.shopify.com/s/files/1/0787/4242/1828/files/V1_Generic_Image_ac86b3-b33b-49de-9020-2c73fbb44a5e.jpg",
    br: "https://cdn.shopify.com/s/files/1/0787/4242/1828/files/BR_Generic_Image_cb710a09-0173-467d-8a88-b1741d7c6411.jpg",
  };
  function getBcFallback(handle: string): string {
    if (/-v1-|-vs-|-vn-|-va-|-vm-|-vt-|-vh-/.test(handle)) return BC_RACING_FALLBACKS.v1;
    return BC_RACING_FALLBACKS.br;
  }
  const isBcRacingProduct = product.handle.startsWith("bc-racing-");
  const rawDisplayImage = activeImage || product.images.edges[0]?.node?.url;
  const displayImage = rawDisplayImage ?? (isBcRacingProduct ? getBcFallback(product.handle) : undefined);
  const isFallbackImage = !rawDisplayImage && !!displayImage;
  const activeImageNode = product.images.edges.find(e => e.node.url === activeImage)?.node ?? product.images.edges[0]?.node;
  const displayImageAlt = activeImageNode?.altText || product.title;
  const variants = product.variants.edges.map((e) => e.node);
  const selectedVariant = variants[selectedVariantIdx] || variants[0];
  const price = selectedVariant?.price || product.priceRange.minVariantPrice;
  // BC Racing coilovers are made-to-order: always allow purchase regardless of
  // Shopify inventory levels (Shopify inventory policy needs separate fix in admin).
  const canBuy = isBcRacingProduct
    ? !!selectedVariant
    : (product.availableForSale && selectedVariant?.availableForSale);
  const maxQty = 200;

  const LIPS_BARRELS_COLLECTIONS = ['outer-wheel-lips', 'inner-barrels'];
  const WHEEL_COLLECTIONS = [
    // Verified handles from Shopify (handles are NOT sequential by inch size)
    '15-inch-wheels',        // 15"
    '15-inch-wheels-copy',   // 16"
    '16-inch-wheels-copy',   // 17"
    '17-inch-wheels-copy',   // 18"
    '18-inch-wheels-copy',   // 19"
    '19-inch-wheels-copy',   // 20"
    'wheels-for-sale',
  ];
  const productCollections = product.collections?.edges?.map((e: any) => e.node.handle) || [];
  const isLipsOrBarrels = productCollections.some((h: string) => LIPS_BARRELS_COLLECTIONS.includes(h));
  const isWheel = productCollections.some((h: string) => WHEEL_COLLECTIONS.includes(h));

  const REFINISHING_OPTIONS = [
    { value: "", label: t('product.noRefinishing') || "No refinishing", price: 0 },
    { value: "powdercoating_centers", label: (t('product.powdercoatingCenters') || "Powdercoating Centers") + " (4 wheels)", price: 400 },
    { value: "powdercoating_monoblocks", label: (t('product.powdercoatingMonoblocks') || "Powdercoating Monoblocks") + " (4 wheels)", price: 400 },
    { value: "ceramic_polish_monoblock", label: (t('product.ceramicPolishMonoblock') || "Ceramic Polish Monoblock") + " (4 wheels)", price: 1350 },
    { value: "ceramic_polish_center", label: (t('product.ceramicPolishCenter') || "Ceramic Polish Center") + " (4 wheels)", price: 850, shopifyVariantId: "gid://shopify/ProductVariant/56372518715772" },
  ];
  const selectedRefinishing = REFINISHING_OPTIONS.find(o => o.value === refinishingOption);
  const refinishingAddon = selectedRefinishing?.shopifyVariantId ? 0 : (selectedRefinishing?.price || 0);
  const isPowdercoat = refinishingOption.startsWith("powdercoating");

  const POWDERCOAT_COLORS = [
    { value: "", label: t('product.selectColor') || "Select a color" },
    { value: "gloss_black", label: t('product.colorGlossBlack') || "Gloss Black" },
    { value: "satin_black", label: t('product.colorSatinBlack') || "Satin Black" },
    { value: "matte_black", label: t('product.colorMatteBlack') || "Matte Black" },
    { value: "gunmetal", label: t('product.colorGunmetal') || "Gunmetal Grey" },
    { value: "bronze", label: t('product.colorBronze') || "Bronze" },
    { value: "gold", label: t('product.colorGold') || "Gold" },
    { value: "champagne_gold", label: t('product.colorChampagneGold') || "Champagne Gold" },
    { value: "gloss_white", label: t('product.colorGlossWhite') || "Gloss White" },
    { value: "silver", label: t('product.colorSilver') || "Silver" },
    { value: "anthracite", label: t('product.colorAnthracite') || "Anthracite" },
    { value: "candy_red", label: t('product.colorCandyRed') || "Candy Red" },
    { value: "midnight_blue", label: t('product.colorMidnightBlue') || "Midnight Blue" },
    { value: "racing_green", label: t('product.colorRacingGreen') || "Racing Green" },
    { value: "hyper_silver", label: t('product.colorHyperSilver') || "Hyper Silver" },
    { value: "custom", label: t('product.colorCustom') || "Custom (specify in notes)" },
  ];

  const productTags = (product.tags || []).map((t: string) => t.toLowerCase());
  const isPreOrder = productTags.includes('pre-order');
  const isMultiPiece = isWheel && productTags.some((tag: string) => /multi[- ]?piece|2[- ]?piece|3[- ]?piece/.test(tag));

  const parsedWheelSpecs = parsedWheelSpecsEarly;

  const FLANGE = 0.5;

  const calcNewSpecs = (origWidth: number, origET: number, origLip: number, newLipStr: string) => {
    const newLip = parseFloat(newLipStr.replace("J", "")) || 0;
    if (!newLip || !origWidth) return null;
    const lipDiff = newLip - origLip;

    let innerBarrel: number;
    let newWidth: number;
    let etShift: number;

    if (mountingStyle === "sandwich") {
      innerBarrel = origWidth - origLip - FLANGE;
      newWidth = newLip + innerBarrel + FLANGE;
      etShift = -lipDiff * 12.7;
    } else if (mountingStyle === "front") {
      innerBarrel = origWidth - origLip;
      newWidth = newLip + innerBarrel;
      etShift = -lipDiff * 25.4;
    } else {
      innerBarrel = origWidth - origLip;
      newWidth = newLip + innerBarrel;
      etShift = 0;
    }

    const newET = Math.round(origET + etShift);
    return { newWidth: Math.round(newWidth * 10) / 10, newET, newLip, innerBarrel: Math.round(innerBarrel * 10) / 10 };
  };

  const OUTER_LIP_VARIANTS: Record<number, Record<string, string>> = {
    15: { "0.5J": "gid://shopify/ProductVariant/55910887555452", "1J": "gid://shopify/ProductVariant/55910887588220", "1.5J": "gid://shopify/ProductVariant/55910887620988", "2J": "gid://shopify/ProductVariant/55910887653756", "2.5J": "gid://shopify/ProductVariant/55910887686524", "3J": "gid://shopify/ProductVariant/55910887719292", "3.5J": "gid://shopify/ProductVariant/55910887752060", "4J": "gid://shopify/ProductVariant/55910887784828", "4.5J": "gid://shopify/ProductVariant/55910887817596", "5J": "gid://shopify/ProductVariant/55910887850364", "5.5J": "gid://shopify/ProductVariant/55910887883132", "6J": "gid://shopify/ProductVariant/55910887915900", "6.5J": "gid://shopify/ProductVariant/55910887948668", "7J": "gid://shopify/ProductVariant/55910887981436", "7.5J": "gid://shopify/ProductVariant/55930272481660" },
    16: { "0.5J": "gid://shopify/ProductVariant/55910884049276", "1J": "gid://shopify/ProductVariant/55910884082044", "1.5J": "gid://shopify/ProductVariant/55910884114812", "2J": "gid://shopify/ProductVariant/55910884147580", "2.5J": "gid://shopify/ProductVariant/55910884180348", "3J": "gid://shopify/ProductVariant/55910884213116", "3.5J": "gid://shopify/ProductVariant/55910884245884", "4J": "gid://shopify/ProductVariant/55910884278652", "4.5J": "gid://shopify/ProductVariant/55910884311420", "5J": "gid://shopify/ProductVariant/55910884344188", "5.5J": "gid://shopify/ProductVariant/55910884376956", "6J": "gid://shopify/ProductVariant/55910884409724", "6.5J": "gid://shopify/ProductVariant/55910884442492", "7J": "gid://shopify/ProductVariant/55910884475260", "7.5J": "gid://shopify/ProductVariant/55930272678268" },
    17: { "0.5J": "gid://shopify/ProductVariant/55910878675324", "1J": "gid://shopify/ProductVariant/55910878708092", "1.5J": "gid://shopify/ProductVariant/55910878740860", "2J": "gid://shopify/ProductVariant/55910878773628", "2.5J": "gid://shopify/ProductVariant/55910878806396", "3J": "gid://shopify/ProductVariant/55910878839164", "3.5J": "gid://shopify/ProductVariant/55910878871932", "4J": "gid://shopify/ProductVariant/55910878904700", "4.5J": "gid://shopify/ProductVariant/55910878937468", "5J": "gid://shopify/ProductVariant/55910878970236", "5.5J": "gid://shopify/ProductVariant/55910879003004", "6J": "gid://shopify/ProductVariant/55910879035772", "6.5J": "gid://shopify/ProductVariant/55910879068540", "7J": "gid://shopify/ProductVariant/55910879101308", "7.5J": "gid://shopify/ProductVariant/55930273235324" },
    18: { "0.5J": "gid://shopify/ProductVariant/55910879330684", "1J": "gid://shopify/ProductVariant/55910879363452", "1.5J": "gid://shopify/ProductVariant/55910879396220", "2J": "gid://shopify/ProductVariant/55910879428988", "2.5J": "gid://shopify/ProductVariant/55910879461756", "3J": "gid://shopify/ProductVariant/55910879494524", "3.5J": "gid://shopify/ProductVariant/55910879527292", "4J": "gid://shopify/ProductVariant/55910879560060", "4.5J": "gid://shopify/ProductVariant/55910879592828", "5J": "gid://shopify/ProductVariant/55910879625596", "5.5J": "gid://shopify/ProductVariant/55910879658364", "6J": "gid://shopify/ProductVariant/55910879691132", "6.5J": "gid://shopify/ProductVariant/55910879723900", "7J": "gid://shopify/ProductVariant/55910879756668", "7.5J": "gid://shopify/ProductVariant/55930273104252" },
    19: { "0.5J": "gid://shopify/ProductVariant/55910880936316", "1J": "gid://shopify/ProductVariant/55910880969084", "1.5J": "gid://shopify/ProductVariant/55910881001852", "2J": "gid://shopify/ProductVariant/55910881034620", "2.5J": "gid://shopify/ProductVariant/55910881067388", "3J": "gid://shopify/ProductVariant/55910881100156", "3.5J": "gid://shopify/ProductVariant/55910881132924", "4J": "gid://shopify/ProductVariant/55910881165692", "4.5J": "gid://shopify/ProductVariant/55910881198460", "5J": "gid://shopify/ProductVariant/55910881231228", "5.5J": "gid://shopify/ProductVariant/55910881263996", "6J": "gid://shopify/ProductVariant/55910881296764", "6.5J": "gid://shopify/ProductVariant/55910881329532", "7J": "gid://shopify/ProductVariant/55910881362300", "7.5J": "gid://shopify/ProductVariant/55930273005948" },
    20: { "0.5J": "gid://shopify/ProductVariant/55910881821052", "1J": "gid://shopify/ProductVariant/55910881853820", "1.5J": "gid://shopify/ProductVariant/55910881886588", "2J": "gid://shopify/ProductVariant/55910881919356", "2.5J": "gid://shopify/ProductVariant/55910881952124", "3J": "gid://shopify/ProductVariant/55910881984892", "3.5J": "gid://shopify/ProductVariant/55910882017660", "4J": "gid://shopify/ProductVariant/55910882050428", "4.5J": "gid://shopify/ProductVariant/55910882083196", "5J": "gid://shopify/ProductVariant/55910882115964", "5.5J": "gid://shopify/ProductVariant/55910882148732", "6J": "gid://shopify/ProductVariant/55910882181500", "6.5J": "gid://shopify/ProductVariant/55910882214268", "7J": "gid://shopify/ProductVariant/55910882247036", "7.5J": "gid://shopify/ProductVariant/55930272809340" },
  };

  const wheelDiameter = parsedWheelSpecs?.diameter || 0;
  const lipVariantsForDiameter = OUTER_LIP_VARIANTS[wheelDiameter] || {};
  const hasLipProducts = Object.keys(lipVariantsForDiameter).length > 0;

  const getLipVariantId = (size: string): string | undefined => lipVariantsForDiameter[size];

  const LIP_SIZES: { value: string; label: string; pricePerLip: number }[] = [
    { value: "", label: t('product.noNewLips') || "No new lips", pricePerLip: 0 },
    ...[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5].map(s => ({ value: `${s}J`, label: `${s}J`, pricePerLip: 210 })),
    ...[4.0, 4.5, 5.0, 5.5].map(s => ({ value: `${s}J`, label: `${s}J`, pricePerLip: 220 })),
    ...[6.0, 6.5, 7.0, 7.5].map(s => ({ value: `${s}J`, label: `${s}J`, pricePerLip: 230 })),
  ];
  const getLipPrice = (size: string) => LIP_SIZES.find(l => l.value === size)?.pricePerLip || 0;
  const LIP_POLISH_PRICE = 400;
  const lipAddon = (() => {
    let total = 0;
    if (hasLipProducts) {
      if (lipPolish) total += LIP_POLISH_PRICE;
      return total;
    }
    if (lipMode === "front") total = getLipPrice(lipFrontSize) * 2;
    else if (lipMode === "rear") total = getLipPrice(lipRearSize) * 2;
    else if (lipMode === "all_same") total = getLipPrice(lipFrontSize) * 4;
    else if (lipMode === "all_diff") total = getLipPrice(lipFrontSize) * 2 + getLipPrice(lipRearSize) * 2;
    if (lipPolish) total += LIP_POLISH_PRICE;
    return total;
  })();

  // ──── Brand-specific SEO ────────────────────────────────────────────────────
  const isStancePartsProduct = productCollections.includes("stanceparts");

  let seoTitle: string = product.title;
  let seoDescription: string =
    product.description?.slice(0, 160) ||
    `${product.title} — available at Juju Wheels.`;
  let seoAdditionalProperty:
    | Array<{ name: string; value: string }>
    | undefined;
  let seoBreadcrumb:
    | Array<{ name: string; url: string }>
    | undefined;
  const seoSku: string = product.handle;

  if (isBcRacingProduct) {
    const bcParsed = parseBcRacingTitle(product.title);
    const bcSeriesLabel = bcParsed.series ? `${bcParsed.series}-Series` : null;
    const { carInfo: bcCarInfo, springRate: bcSpringRate } = bcParsed;

    if (bcSeriesLabel && bcCarInfo) {
      seoTitle = `BC Racing ${bcSeriesLabel} Coilovers — ${bcCarInfo}`;
    } else if (bcSeriesLabel) {
      seoTitle = `BC Racing ${bcSeriesLabel} Coilovers`;
    }

    if (bcSeriesLabel && bcCarInfo) {
      const base = `BC Racing ${bcSeriesLabel} coilovers for ${bcCarInfo}`;
      const withSpring = bcSpringRate
        ? `${base} — ${bcSpringRate}, available at Juju Wheels.`
        : `${base}, available new at Juju Wheels.`;
      seoDescription =
        withSpring.length <= 160 ? withSpring : `${base}, available at Juju Wheels.`;
    }

    const props = [
      ...(bcParsed.series ? [{ name: "Series", value: bcParsed.series }] : []),
      ...(bcCarInfo ? [{ name: "Vehicle", value: bcCarInfo }] : []),
      ...(bcSpringRate ? [{ name: "Spring Rate", value: bcSpringRate }] : []),
    ];
    seoAdditionalProperty = props.length ? props : undefined;

    seoBreadcrumb = [
      { name: "Home", url: "/" },
      { name: "BC Racing", url: "/bc-racing" },
      { name: product.title, url: `/products/${handle}` },
    ];
  } else if (isStancePartsProduct) {
    const spName =
      product.title.replace(/^stanceparts[\s-]*/i, "").trim() || product.title;
    seoTitle = `StanceParts ${spName} — Air Cup Lift System`;
    const base = `StanceParts ${spName} air cup lift system`;
    const full = `${base} — raise your ride up to 50mm without permanent mods, available at Juju Wheels.`;
    seoDescription = full.length <= 160 ? full : `${base}, available at Juju Wheels.`;
    seoAdditionalProperty = [{ name: "Type", value: "Air Cup Lift System" }];
    seoBreadcrumb = [
      { name: "Home", url: "/" },
      { name: "StanceParts", url: "/stanceparts" },
      { name: product.title, url: `/products/${handle}` },
    ];
  }
  // ──────────────────────────────────────────────────────────────────────────

  const isSpacer = /spacer|adapter/i.test(product.title) || /spacer|adapter/i.test(product.productType);

  const SPACER_PRICES: Record<string, number> = {
    "15 mm": 159.99, "16 mm": 159.99, "17 mm": 159.99, "18 mm": 159.99, "19 mm": 159.99,
    "20 mm": 179.99, "21 mm": 179.99, "22 mm": 179.99, "23 mm": 179.99, "24 mm": 179.99,
    "25 mm": 181.99, "26 mm": 181.99, "27 mm": 181.99, "28 mm": 181.99, "29 mm": 181.99,
    "30 mm": 183.99, "31 mm": 183.99, "32 mm": 183.99, "33 mm": 183.99, "34 mm": 183.99,
    "35 mm": 189.99, "36 mm": 189.99, "37 mm": 189.99, "38 mm": 189.99, "39 mm": 189.99,
    "40 mm": 193.99, "41 mm": 193.99, "42 mm": 193.99, "43 mm": 193.99, "44 mm": 193.99,
    "45 mm": 204.99, "46 mm": 204.99, "47 mm": 204.99, "48 mm": 204.99, "49 mm": 204.99,
    "50 mm": 207.99,
  };
  const spacerDisplayPrice = isSpacer && spacerConfig.thickness ? SPACER_PRICES[spacerConfig.thickness] || null : null;

  const singleWheelImage = (product.images.edges?.length || 0) > 1
    ? product.images.edges[1]?.node?.url
    : product.images.edges[0]?.node?.url;


  const handleAddToCart = () => {
    if (!selectedVariant?.id) return;

    const attrs: { key: string; value: string }[] = [];

    if (isLipsOrBarrels && customerNote.trim()) {
      attrs.push({ key: "Customer Note", value: customerNote.trim() });
    }

    if (isSpacer) {
      if (spacerConfig.pcdHub) attrs.push({ key: "PCD (Hub Side)", value: spacerConfig.pcdHub });
      if (spacerConfig.centerBoreHub) attrs.push({ key: "Center Bore (Hub)", value: spacerConfig.centerBoreHub });
      if (spacerConfig.threadHub) attrs.push({ key: "Thread (Hub Side)", value: spacerConfig.threadHub });
      if (spacerConfig.fixingType) attrs.push({ key: "Fixing Type (Hub)", value: spacerConfig.fixingType });
      attrs.push({ key: "PCD (Wheel Side)", value: spacerConfig.pcdWheel || spacerConfig.pcdHub || "Same as hub" });
      attrs.push({ key: "Center Bore (Wheel)", value: spacerConfig.centerBoreWheel || spacerConfig.centerBoreHub || "Same as hub" });
      attrs.push({ key: "Thread (Wheel Side)", value: spacerConfig.threadWheel || spacerConfig.threadHub || "Same as hub" });
      attrs.push({ key: "Fixing Type (Wheel)", value: spacerConfig.fixingTypeWheel || spacerConfig.fixingType || "Same as hub" });
      if (spacerConfig.thickness) attrs.push({ key: "Spacer Thickness", value: spacerConfig.thickness });
      if (spacerConfig.noteCar.trim()) attrs.push({ key: "Car", value: spacerConfig.noteCar.trim() });
      if (spacerConfig.noteWheels.trim()) attrs.push({ key: "Wheels", value: spacerConfig.noteWheels.trim() });
      if (spacerConfig.pcdHubCustom?.trim()) attrs.push({ key: "PCD (Hub Custom)", value: spacerConfig.pcdHubCustom.trim() });
      if (spacerConfig.pcdWheelCustom?.trim()) attrs.push({ key: "PCD (Wheel Custom)", value: spacerConfig.pcdWheelCustom.trim() });
    }

    const extraLines: { merchandiseId: string; quantity: number; attributes?: { key: string; value: string }[] }[] = [];

    if (isWheel && refinishingOption) {
      const opt = REFINISHING_OPTIONS.find(o => o.value === refinishingOption);
      if (opt) {
        if (opt.shopifyVariantId) {
          extraLines.push({
            merchandiseId: opt.shopifyVariantId,
            quantity: 1,
            attributes: [{ key: "For", value: product.title }],
          });
          attrs.push({ key: "Refinishing", value: opt.label });
        } else {
          attrs.push({ key: "Refinishing", value: `${opt.label} (+€${opt.price})` });
        }
      }
      if (isPowdercoat && powdercoatColor) {
        const colorLabel = powdercoatColor === "custom" && customColorText.trim()
          ? `Custom: ${customColorText.trim()}`
          : POWDERCOAT_COLORS.find(c => c.value === powdercoatColor)?.label || powdercoatColor;
        attrs.push({ key: "Powdercoat Color", value: colorLabel });
      }
    }

    if (isMultiPiece && lipPolish) {
      attrs.push({ key: "Lip Polish", value: `Polish Current Outer Lips (+€${LIP_POLISH_PRICE})` });
    }

    if (isMultiPiece && lipMode !== "none") {
      const addLipLine = (size: string, qty: number, position: string) => {
        const variantId = getLipVariantId(size);
        if (variantId) {
          extraLines.push({
            merchandiseId: variantId,
            quantity: qty,
            attributes: [
              { key: "For", value: product.title },
              { key: "Position", value: position },
            ],
          });
          attrs.push({ key: `New Outer Lips (${position})`, value: `${size} × ${qty}` });
        } else {
          attrs.push({ key: `New Outer Lips (${position})`, value: `${size} × ${qty} (+€${getLipPrice(size) * qty})` });
        }
      };

      if (lipMode === "front" && lipFrontSize) {
        addLipLine(lipFrontSize, 2, "Front");
      } else if (lipMode === "rear" && lipRearSize) {
        addLipLine(lipRearSize, 2, "Rear");
      } else if (lipMode === "all_same" && lipFrontSize) {
        addLipLine(lipFrontSize, 4, "All 4");
      } else if (lipMode === "all_diff") {
        if (lipFrontSize) addLipLine(lipFrontSize, 2, "Front");
        if (lipRearSize) addLipLine(lipRearSize, 2, "Rear");
      }

      if (parsedWheelSpecs) {
        attrs.push({ key: "Mounting Style", value: mountingStyle === "sandwich" ? "Sandwich" : mountingStyle === "front" ? "Front Mount" : "Rear Mount" });
        const fLip = lipMode === "rear" ? "" : lipFrontSize;
        const rLip = lipMode === "front" ? "" : (lipMode === "all_same" ? lipFrontSize : lipRearSize);
        const fCalc =
          fLip && parsedWheelSpecs.widthFront !== null && parsedWheelSpecs.offsetFront !== null
            ? calcNewSpecs(parsedWheelSpecs.widthFront, parsedWheelSpecs.offsetFront, currentOuterLip, fLip)
            : null;
        const rCalc =
          rLip && parsedWheelSpecs.widthRear !== null && parsedWheelSpecs.offsetRear !== null
            ? calcNewSpecs(parsedWheelSpecs.widthRear, parsedWheelSpecs.offsetRear, currentOuterLip, rLip)
            : null;
        if (fCalc && !parsedWheelSpecs.isStaggered) {
          attrs.push({ key: "Final Specs", value: `${fCalc.newWidth}J / ET${fCalc.newET}` });
        } else {
          if (fCalc) attrs.push({ key: "Final Specs (Front)", value: `${fCalc.newWidth}J / ET${fCalc.newET}` });
          if (rCalc) attrs.push({ key: "Final Specs (Rear)", value: `${rCalc.newWidth}J / ET${rCalc.newET}` });
        }
      }
    }

    addItem(selectedVariant.id, quantity, attrs.length > 0 ? attrs : undefined, extraLines.length > 0 ? extraLines : undefined);
    setQuantity(1);
    setCustomerNote("");
    setRefinishingOption("");
    setPowdercoatColor("");
    setCustomColorText("");
    setLipMode("none");
    setLipFrontSize("");
    setLipRearSize("");
    setLipPolish(false);
    setSpacerConfig({ pcdWheel: "", pcdHub: "", pcdHubCustom: "", pcdWheelCustom: "", centerBoreWheel: "", centerBoreHub: "", threadHub: "", threadWheel: "", fixingType: "", fixingTypeWheel: "", thickness: "", noteCar: "", noteWheels: "" });
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <SEO
        title={seoTitle}
        description={seoDescription}
        type="product"
        image={product.images?.edges?.[0]?.node?.url}
        breadcrumb={seoBreadcrumb}
        productJsonLd={{
          name: product.title,
          description: product.description?.slice(0, 300),
          image: product.images?.edges?.[0]?.node?.url,
          price: product.priceRange?.minVariantPrice?.amount,
          currency: product.priceRange?.minVariantPrice?.currencyCode || "EUR",
          availability: product.availableForSale,
          brand: findBrandStory(product.title)?.brand.brand,
          sku: seoSku,
          additionalProperty: seoAdditionalProperty,
        }}
      />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Gallery */}
          <div className="space-y-4 lg:col-span-7">
            <div className={`${isBcRacingProduct ? 'aspect-square' : 'aspect-[4/5]'} bg-white/5 border border-white/10 overflow-hidden relative group cursor-zoom-in`}>
              {displayImage && (
                <img 
                  src={isFallbackImage ? displayImage : shopifyImageUrl(displayImage, 900)} 
                  alt={displayImageAlt} 
                  className={`w-full h-full ${isBcRacingProduct ? 'object-contain p-6' : 'object-cover'} transition-transform duration-700 group-hover:scale-105${isPreOrder ? ' contrast-[1.15] brightness-[0.85]' : ''}`}
                  data-testid="img-product-main"
                  width={800}
                  height={800}
                />
              )}
            </div>
            {product.images.edges.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                 {product.images.edges.map((img, idx) => (
                   <div 
                     key={idx} 
                     className={`aspect-square bg-white/5 cursor-pointer border ${(activeImage || product.images.edges[0]?.node?.url) === img.node.url ? 'border-primary' : 'border-white/10 hover:border-white/30'} transition-colors`}
                     onClick={() => setActiveImage(img.node.url)}
                     data-testid={`button-thumbnail-${idx}`}
                   >
                     <img src={shopifyImageUrl(img.node.url, 200)} alt={img.node.altText || `${product.title} image ${idx + 1}`} className={`w-full h-full object-cover${isPreOrder ? ' contrast-[1.15] brightness-[0.85]' : ''}`} width={200} height={200} />
                   </div>
                 ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6 lg:col-span-5">
            <div>
               {(() => {
                 const brandData = findBrandStory(product.title);
                 if (!brandData?.brand.logo) return null;
                 return (
                   <div className="mb-4" data-testid="img-brand-logo-container">
                     <img
                       src={brandData.brand.logo}
                       alt={`${brandData.brand.brand} logo`}
                       className="h-8 md:h-10 max-w-[200px] object-contain object-left"
                       data-testid="img-brand-logo"
                       loading="eager"
                     />
                   </div>
                 );
               })()}
               <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-3 uppercase leading-tight" data-testid="text-product-title">{product.title}</h1>
               <div className="flex items-baseline gap-4">
                 <span className="text-3xl font-tech font-bold text-primary" data-testid="text-product-price">
                    {isSpacer ? (
                      spacerDisplayPrice
                        ? <>€{spacerDisplayPrice.toFixed(2)} <span className="text-xs text-white/40 ml-1">{t('spacer.pricePerPair')}</span></>
                        : <>{t('spacer.fromPrice') || 'From'} €159.99</>
                    ) : (refinishingAddon + lipAddon) > 0 ? (
                      <>
                        {formatPrice({ amount: String(parseFloat(price.amount) + refinishingAddon + lipAddon), currencyCode: price.currencyCode })}
                        <span className="text-sm text-white/40 ml-2 line-through">{formatPrice(price)}</span>
                      </>
                    ) : formatPrice(price)}
                 </span>
               </div>
               {/* Specs stat bar */}
               {quickWheelSpecs && (() => {
                 const cells = [
                   { label: 'SIZE', value: quickWheelSpecs.diameter ? `${quickWheelSpecs.diameter}"` : null },
                   { label: 'WIDTH', value: quickWheelSpecs.width },
                   { label: 'OFFSET', value: quickWheelSpecs.et },
                   { label: 'PCD', value: quickWheelSpecs.pcd },
                 ].filter(c => c.value);
                 if (!cells.length) return null;
                 return (
                   <div className="grid grid-cols-4 border border-white/10 divide-x divide-white/10 mt-1" data-testid="specs-stat-bar">
                     {cells.map(c => (
                       <div key={c.label} className="flex flex-col items-center justify-center py-3 px-2 gap-0.5">
                         <span className="text-[9px] font-tech text-white/30 uppercase tracking-[0.25em]">{c.label}</span>
                         <span className="text-sm font-tech text-white font-bold tracking-wide">{c.value}</span>
                       </div>
                     ))}
                   </div>
                 );
               })()}
            </div>

            <Separator className="bg-white/10" />

            {/* Variant Selector */}
            {variants.length > 1 && (
              <div className="space-y-3">
                <h3 className="text-white font-tech uppercase tracking-wider text-sm">{t('product.options')}</h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant, idx) => (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariantIdx(idx);
                        if (variant.image?.url) setActiveImage(variant.image.url);
                      }}
                      className={`px-4 py-2 text-sm font-tech uppercase tracking-wider border transition-colors ${
                        selectedVariantIdx === idx
                          ? "border-primary text-primary bg-primary/10"
                          : "border-white/20 text-white/70 hover:border-white/40"
                      } ${!variant.availableForSale ? "opacity-40 line-through" : ""}`}
                      data-testid={`button-variant-${idx}`}
                    >
                      {variant.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wheel Visualizer Button */}
            {isWheel && (
              <button
                onClick={() => setShowVisualizer(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors group"
                data-testid="button-visualizer"
              >
                <Eye className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-white font-tech uppercase tracking-widest text-sm">{t('product.visualizeOnCar')}</span>
              </button>
            )}

            {/* Fitment Checker */}
            {isWheel && (
              <div className="border border-white/10 bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-[2px] w-3 bg-primary flex-shrink-0" />
                  <h3 className="text-[10px] font-tech uppercase tracking-[0.3em] text-primary">
                    {t('product.checkFitment') || 'Check Fitment'}
                  </h3>
                </div>
                <FitmentChecker
                  wheelPcd={wheelSpecs?.pcd ?? null}
                />
              </div>
            )}

            {/* Refinishing Upsell */}
            {isWheel && (
              <Accordion type="single" collapsible className="border border-white/10">
                <AccordionItem value="refinishing" className="border-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5 font-tech uppercase tracking-wider text-sm text-white/70 data-[state=open]:text-primary [&>svg]:hidden group">
                    <span className="flex items-center gap-3 flex-1 min-w-0">
                      <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block">{t('product.refinishingOptions') || 'Refinishing Options'}</span>
                        <span className="block text-[10px] font-tech normal-case tracking-wider text-white/30 mt-0.5">Powdercoat, ceramic polish &amp; more</span>
                      </span>
                      <span className="text-primary text-lg leading-none flex-shrink-0 group-data-[state=open]:hidden">+</span>
                      <span className="text-primary text-lg leading-none flex-shrink-0 hidden group-data-[state=open]:block">−</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3 pt-2">
                <select
                  value={refinishingOption}
                  onChange={(e) => { setRefinishingOption(e.target.value); setPowdercoatColor(""); }}
                  className="w-full bg-black border border-white/20 text-white p-3 text-sm font-tech uppercase tracking-wider focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23E9D355' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  data-testid="select-refinishing"
                >
                  {REFINISHING_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}{opt.price > 0 ? ` (+€${opt.price.toLocaleString()})` : ''}
                    </option>
                  ))}
                </select>
                {isPowdercoat && (
                  <select
                    value={powdercoatColor}
                    onChange={(e) => setPowdercoatColor(e.target.value)}
                    className="w-full bg-black border border-white/20 text-white p-3 text-sm font-tech uppercase tracking-wider focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23E9D355' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    data-testid="select-powdercoat-color"
                  >
                    {POWDERCOAT_COLORS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                )}
                {isPowdercoat && powdercoatColor === "custom" && (
                  <input
                    type="text"
                    value={customColorText}
                    onChange={(e) => setCustomColorText(e.target.value)}
                    placeholder={t('product.customColorPlaceholder') || "e.g. RAL 3020 Traffic Red, Midnight Purple Pearl..."}
                    className="w-full bg-black border border-white/20 text-white p-3 text-sm font-tech tracking-wider focus:border-primary outline-none transition-colors placeholder:text-white/30"
                    data-testid="input-custom-color"
                  />
                )}
                {refinishingAddon > 0 && (
                  <p className="text-[10px] text-primary/60 font-tech uppercase tracking-wider">
                    {t('product.refinishingNote') || 'Refinishing will be applied after purchase. We will contact you for details.'}
                  </p>
                )}
                {selectedRefinishing?.shopifyVariantId && refinishingOption && (
                  <p className="text-[10px] text-primary/60 font-tech uppercase tracking-wider">
                    {t('product.refinishingSeparateItem') || 'Ceramic polishing service will be added as a separate item in your cart (€850).'}
                  </p>
                )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* New Outer Lips Upsell — multi-piece wheels only */}
            {isMultiPiece && (
              <Accordion type="single" collapsible className="border border-white/10">
                <AccordionItem value="outer-lips" className="border-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5 font-tech uppercase tracking-wider text-sm text-white/70 data-[state=open]:text-primary [&>svg]:hidden group">
                    <span className="flex items-center gap-3 flex-1 min-w-0">
                      <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block">{t('product.newOuterLips') || 'Add New Outer Lips'}</span>
                        <span className="block text-[10px] font-tech normal-case tracking-wider text-white/30 mt-0.5">Front, rear or full set</span>
                      </span>
                      <span className="text-primary text-lg leading-none flex-shrink-0 group-data-[state=open]:hidden">+</span>
                      <span className="text-primary text-lg leading-none flex-shrink-0 hidden group-data-[state=open]:block">−</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3 pt-2">
                <div className="flex gap-1">
                  {([
                    { val: "none" as const, label: t('product.lipNone') || "None" },
                    { val: "front" as const, label: t('product.lipFrontOnly') || "Front (2)" },
                    { val: "rear" as const, label: t('product.lipRearOnly') || "Rear (2)" },
                    { val: "all_same" as const, label: t('product.lipAllSame') || "All Same (4)" },
                    { val: "all_diff" as const, label: t('product.lipAllDiff') || "F+R Diff (4)" },
                  ]).map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => { setLipMode(opt.val); if (opt.val === "none") { setLipFrontSize(""); setLipRearSize(""); } }}
                      className={`flex-1 py-2 text-[10px] font-tech uppercase tracking-wider border transition-colors ${
                        lipMode === opt.val
                          ? "border-primary text-primary bg-primary/10"
                          : "border-white/20 text-white/50 hover:border-white/40"
                      }`}
                      data-testid={`button-lip-${opt.val}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>


                {(lipMode === "front" || lipMode === "all_same") && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-tech text-white/50 uppercase tracking-wider">
                      {lipMode === "front" ? (t('product.lipFrontLabel') || "Front lip size") : (t('product.lipAllLabel') || "Lip size (all 4)")}
                    </label>
                    <select
                      value={lipFrontSize}
                      onChange={(e) => setLipFrontSize(e.target.value)}
                      className="w-full bg-black border border-white/20 text-white p-3 text-sm font-tech uppercase tracking-wider focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23E9D355' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                      data-testid="select-lip-front"
                    >
                      {LIP_SIZES.map(lip => (
                        <option key={lip.value} value={lip.value}>
                          {lip.value ? `${lip.label} — €${lip.pricePerLip}/lip × ${lipMode === "all_same" ? 4 : 2} = €${lip.pricePerLip * (lipMode === "all_same" ? 4 : 2)}` : lip.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {lipMode === "rear" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-tech text-white/50 uppercase tracking-wider">
                      {t('product.lipRearLabel') || "Rear lip size"}
                    </label>
                    <select
                      value={lipRearSize}
                      onChange={(e) => setLipRearSize(e.target.value)}
                      className="w-full bg-black border border-white/20 text-white p-3 text-sm font-tech uppercase tracking-wider focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23E9D355' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                      data-testid="select-lip-rear"
                    >
                      {LIP_SIZES.map(lip => (
                        <option key={lip.value} value={lip.value}>
                          {lip.value ? `${lip.label} — €${lip.pricePerLip}/lip × 2 = €${lip.pricePerLip * 2}` : lip.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {lipMode === "all_diff" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-tech text-white/50 uppercase tracking-wider">
                        {t('product.lipFrontLabel') || "Front lip size"}
                      </label>
                      <select
                        value={lipFrontSize}
                        onChange={(e) => setLipFrontSize(e.target.value)}
                        className="w-full bg-black border border-white/20 text-white p-3 text-sm font-tech uppercase tracking-wider focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23E9D355' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                        data-testid="select-lip-front-diff"
                      >
                        {LIP_SIZES.map(lip => (
                          <option key={lip.value} value={lip.value}>
                            {lip.value ? `${lip.label} — €${lip.pricePerLip} × 2` : lip.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-tech text-white/50 uppercase tracking-wider">
                        {t('product.lipRearLabel') || "Rear lip size"}
                      </label>
                      <select
                        value={lipRearSize}
                        onChange={(e) => setLipRearSize(e.target.value)}
                        className="w-full bg-black border border-white/20 text-white p-3 text-sm font-tech uppercase tracking-wider focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23E9D355' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                        data-testid="select-lip-rear-diff"
                      >
                        {LIP_SIZES.map(lip => (
                          <option key={lip.value} value={lip.value}>
                            {lip.value ? `${lip.label} — €${lip.pricePerLip} × 2` : lip.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {lipMode !== "none" && (lipFrontSize || lipRearSize) && hasLipProducts && (
                  <p className="text-[10px] text-primary/60 font-tech uppercase tracking-wider">
                    {t('product.lipsSeparateItem') || `Outer lips (${wheelDiameter}") will be added as separate items in your cart.`}
                  </p>
                )}
                {lipAddon > 0 && !hasLipProducts && (
                  <p className="text-[10px] text-primary/60 font-tech uppercase tracking-wider">
                    {t('product.newLipsNote') || 'New outer lips will be fitted to your wheels after purchase.'}
                  </p>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-tech text-white/50 uppercase tracking-wider">
                    {t('product.lipPolishLabel') || "Polish outer lips"}
                  </label>
                  <select
                    value={lipPolish ? "polish" : ""}
                    onChange={(e) => setLipPolish(e.target.value === "polish")}
                    className="w-full bg-black border border-white/20 text-white p-3 text-sm font-tech uppercase tracking-wider focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23E9D355' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    data-testid="select-lip-polish"
                  >
                    <option value="">{t('product.lipPolishNone') || "No polish"}</option>
                    <option value="polish">{t('product.lipPolishOption') || `Polish Outer Lips — +€${LIP_POLISH_PRICE}`}</option>
                  </select>
                </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Spacer/Adapter Configurator */}
            {isSpacer && (
              <div className="bg-white/5 p-6 border border-white/10 space-y-6">
                <h4 className="text-white font-display uppercase tracking-wider text-sm border-b border-white/10 pb-2">{t('product.configureSpacers')}</h4>

                <div className="border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <button
                    onClick={() => {
                      setSpacerVehicleLookup(!spacerVehicleLookup);
                      if (!spacerVehicleLookup && svMakes.length === 0) {
                        setSvLoading("makes");
                        fetch("/api/wheel-size/makes")
                          .then(r => r.ok ? r.json() : Promise.reject())
                          .then(resp => setSvMakes(Array.isArray(resp?.data) ? resp.data : []))
                          .catch(() => {})
                          .finally(() => setSvLoading(""));
                      }
                    }}
                    className="w-full flex items-center justify-between group"
                    data-testid="button-spacer-find-car"
                  >
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      <span className="text-primary font-tech uppercase tracking-widest text-xs font-bold">
                        {t('spacer.findMyCar')}
                      </span>
                    </div>
                    <Search className={`w-4 h-4 text-primary/60 transition-transform ${spacerVehicleLookup ? 'rotate-90' : ''}`} />
                  </button>

                  {spacerVehicleLookup && (
                    <div className="space-y-3 pt-2 border-t border-primary/20">
                      {svApplied && (
                        <div className="flex items-center gap-2 text-green-400 text-xs font-tech uppercase tracking-wider">
                          <span>✓</span>
                          <span>{t('spacer.specsApplied')}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-tech text-white/50 uppercase">{t('vehicle.make')}</label>
                          <select
                            value={svMake}
                            onChange={(e) => {
                              setSvMake(e.target.value); setSvModel(""); setSvYear(""); setSvMod("");
                              setSvModels([]); setSvYears([]); setSvMods([]); setSvApplied(false);
                              if (e.target.value) {
                                setSvLoading("models");
                                fetch(`/api/wheel-size/models?make=${encodeURIComponent(e.target.value)}`)
                                  .then(r => r.ok ? r.json() : Promise.reject())
                                  .then(resp => setSvModels(Array.isArray(resp?.data) ? resp.data : []))
                                  .catch(() => {})
                                  .finally(() => setSvLoading(""));
                              }
                            }}
                            className="w-full bg-black border border-white/20 text-white p-2 text-xs focus:border-primary outline-none transition-colors"
                            data-testid="select-spacer-make"
                          >
                            <option value="">{svLoading === "makes" ? `${t('general.loading')}` : t('vehicle.selectMake')}</option>
                            {svMakes.map(m => <option key={m.slug} value={m.slug}>{m.name}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-tech text-white/50 uppercase">{t('vehicle.model')}</label>
                          <select
                            value={svModel}
                            disabled={!svMake}
                            onChange={(e) => {
                              setSvModel(e.target.value); setSvYear(""); setSvMod("");
                              setSvYears([]); setSvMods([]); setSvApplied(false);
                              if (e.target.value) {
                                setSvLoading("years");
                                fetch(`/api/wheel-size/years?make=${encodeURIComponent(svMake)}&model=${encodeURIComponent(e.target.value)}`)
                                  .then(r => r.ok ? r.json() : Promise.reject())
                                  .then(resp => setSvYears(Array.isArray(resp?.data) ? resp.data : []))
                                  .catch(() => {})
                                  .finally(() => setSvLoading(""));
                              }
                            }}
                            className="w-full bg-black border border-white/20 text-white p-2 text-xs focus:border-primary outline-none transition-colors disabled:opacity-40"
                            data-testid="select-spacer-model"
                          >
                            <option value="">{svLoading === "models" ? `${t('general.loading')}` : t('vehicle.selectModel')}</option>
                            {svModels.map(m => <option key={m.slug} value={m.slug}>{m.name}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-tech text-white/50 uppercase">{t('vehicle.year')}</label>
                          <select
                            value={svYear}
                            disabled={!svModel}
                            onChange={(e) => {
                              setSvYear(e.target.value); setSvMod(""); setSvMods([]); setSvApplied(false);
                              if (e.target.value) {
                                setSvLoading("mods");
                                fetch(`/api/wheel-size/modifications?make=${encodeURIComponent(svMake)}&model=${encodeURIComponent(svModel)}&year=${encodeURIComponent(e.target.value)}`)
                                  .then(r => r.ok ? r.json() : Promise.reject())
                                  .then(resp => setSvMods(Array.isArray(resp?.data) ? resp.data : []))
                                  .catch(() => {})
                                  .finally(() => setSvLoading(""));
                              }
                            }}
                            className="w-full bg-black border border-white/20 text-white p-2 text-xs focus:border-primary outline-none transition-colors disabled:opacity-40"
                            data-testid="select-spacer-year"
                          >
                            <option value="">{svLoading === "years" ? `${t('general.loading')}` : t('vehicle.selectYear')}</option>
                            {svYears.map(y => <option key={y.slug} value={y.slug}>{y.name}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-tech text-white/50 uppercase">{t('vehicle.trim')}</label>
                          <select
                            value={svMod}
                            disabled={!svYear}
                            onChange={(e) => { setSvMod(e.target.value); setSvApplied(false); }}
                            className="w-full bg-black border border-white/20 text-white p-2 text-xs focus:border-primary outline-none transition-colors disabled:opacity-40"
                            data-testid="select-spacer-trim"
                          >
                            <option value="">{svLoading === "mods" ? `${t('general.loading')}` : t('vehicle.selectTrim')}</option>
                            {svMods.map(m => <option key={m.slug} value={m.slug}>{m.name}</option>)}
                          </select>
                        </div>
                      </div>

                      {svYear && (
                        <button
                          onClick={() => {
                            setSvLoading("search");
                            const params = new URLSearchParams({ make: svMake, model: svModel, year: svYear });
                            if (svMod) params.set("modification", svMod);
                            fetch(`/api/wheel-size/search?${params}`)
                              .then(r => r.ok ? r.json() : Promise.reject())
                              .then(resp => {
                                const items = Array.isArray(resp?.data) ? resp.data : [];
                                if (items.length > 0) {
                                  const tech = items[0].technical;
                                  const rawBolt = tech?.bolt_pattern || `${tech?.stud_holes}x${tech?.pcd}`;
                                  const boltPattern = rawBolt.replace(/\s/g, "").replace(/\.0$/, "");
                                  const centreBore = tech?.centre_bore ? String(tech.centre_bore).replace(/\.0$/, "") : "";
                                  const rawThread = (tech?.wheel_fasteners?.thread_size || "").replace(/\s/g, "");
                                  const THREAD_MAP: Record<string, string> = {
                                    "M12x1.25": "M12x1.25", "M12X1.25": "M12x1.25",
                                    "M12x1.5": "M12x1.5", "M12X1.5": "M12x1.5", "M12x1.50": "M12x1.5",
                                    "M12x1.75": "M12x1.75", "M12X1.75": "M12x1.75",
                                    "M14x1.25": "M14x1.25", "M14X1.25": "M14x1.25",
                                    "M14x1.5": "M14x1.5", "M14X1.5": "M14x1.5", "M14x1.50": "M14x1.5",
                                    "M14x1.75": "M14x1.75", "M14X1.75": "M14x1.75",
                                    "M14x2.0": "M14x2.0", "M14X2.0": "M14x2.0", "M14x2": "M14x2.0", "M14x2.00": "M14x2.0",
                                  };
                                  const threadSize = THREAD_MAP[rawThread] || rawThread;
                                  const PCD_OPTIONS = ["3x112","4x95.25","4x98","4x100","4x108","4x110","4x114.3","4x115","5x98","5x100","5x105","5x108","5x110","5x112","5x114.3","5x115","5x118","5x120","5x120.65","5x127","5x130","5x135","5x139.7","5x150","6x114.3","6x115","6x125","6x127","6x130","6x135","6x139.7","6x150"];
                                  const matchedPCD = PCD_OPTIONS.find(p => p === boltPattern) || "";
                                  const fastenerType = tech?.wheel_fasteners?.type || "";
                                  const fixType = /bolt/i.test(fastenerType) ? "Bolts (Threaded)" : /nut|stud/i.test(fastenerType) ? "Nuts (Studs)" : "";
                                  setSpacerConfig(s => ({
                                    ...s,
                                    pcdHub: matchedPCD || "other",
                                    pcdHubCustom: matchedPCD ? "" : boltPattern,
                                    centerBoreHub: centreBore,
                                    threadHub: threadSize,
                                    fixingType: fixType,
                                  }));
                                  setSvApplied(true);
                                }
                              })
                              .catch(() => {})
                              .finally(() => setSvLoading(""));
                          }}
                          disabled={svLoading === "search"}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-black font-tech uppercase tracking-widest text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                          data-testid="button-spacer-lookup"
                        >
                          {svLoading === "search" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          {t('spacer.lookupSpecs')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-5">
                  <div className="border-b border-white/10 pb-1 mb-1">
                    <span className="text-[10px] font-tech text-primary/70 uppercase tracking-[0.2em]">{t('spacer.hubSide')}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-tech text-white/70 uppercase">{t('spacer.pcdHub')} *</label>
                      <select
                        value={spacerConfig.pcdHub}
                        onChange={(e) => {
                          const newHub = e.target.value;
                          const newLugs = newHub && newHub !== "other" ? newHub.split("x")[0] : null;
                          setSpacerConfig(s => {
                            const wheelLugs = s.pcdWheel && s.pcdWheel !== "other" ? s.pcdWheel.split("x")[0] : null;
                            const resetWheel = newLugs && wheelLugs && newLugs !== wheelLugs;
                            return { ...s, pcdHub: newHub, ...(resetWheel ? { pcdWheel: "", pcdWheelCustom: "" } : {}) };
                          });
                        }}
                        className={`w-full bg-black border text-white p-2 text-sm focus:border-primary outline-none transition-colors ${svApplied && spacerConfig.pcdHub ? 'border-green-500/50' : 'border-white/20'}`}
                        data-testid="select-pcd-hub"
                      >
                        <option value="">{t('product.selectPCD')}</option>
                        <option>3x112</option>
                        <option>4x95.25</option>
                        <option>4x98</option>
                        <option>4x100</option>
                        <option>4x108</option>
                        <option>4x110</option>
                        <option>4x114.3</option>
                        <option>4x115</option>
                        <option>5x98</option>
                        <option>5x100</option>
                        <option>5x105</option>
                        <option>5x108</option>
                        <option>5x110</option>
                        <option>5x112</option>
                        <option>5x114.3</option>
                        <option>5x115</option>
                        <option>5x118</option>
                        <option>5x120</option>
                        <option>5x120.65</option>
                        <option>5x127</option>
                        <option>5x130</option>
                        <option>5x135</option>
                        <option>5x139.7</option>
                        <option>5x150</option>
                        <option>6x114.3</option>
                        <option>6x115</option>
                        <option>6x125</option>
                        <option>6x127</option>
                        <option>6x130</option>
                        <option>6x135</option>
                        <option>6x139.7</option>
                        <option>6x150</option>
                        <option value="other">{t('spacer.otherPCD')}</option>
                      </select>
                      {spacerConfig.pcdHub === "other" && (
                        <input
                          type="text"
                          placeholder="e.g. 5x108"
                          value={spacerConfig.pcdHubCustom}
                          onChange={(e) => setSpacerConfig(s => ({ ...s, pcdHubCustom: e.target.value }))}
                          className="w-full bg-black border border-primary/40 text-white p-2 text-sm focus:border-primary outline-none transition-colors mt-2"
                          data-testid="input-pcd-hub-custom"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-tech text-white/70 uppercase">{t('spacer.centerBoreHub')} *</label>
                      <input
                        type="text"
                        placeholder="e.g. 66.6"
                        value={spacerConfig.centerBoreHub}
                        onChange={(e) => setSpacerConfig(s => ({ ...s, centerBoreHub: e.target.value }))}
                        className={`w-full bg-black border text-white p-2 text-sm focus:border-primary outline-none transition-colors ${svApplied && spacerConfig.centerBoreHub ? 'border-green-500/50' : 'border-white/20'}`}
                        data-testid="input-center-bore-hub"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-tech text-white/70 uppercase">{t('spacer.threadHub')} *</label>
                      <input
                        list="thread-hub-options"
                        value={spacerConfig.threadHub}
                        onChange={(e) => setSpacerConfig(s => ({ ...s, threadHub: e.target.value }))}
                        placeholder={t('product.pleaseChoose') || "-- Please choose --"}
                        className={`w-full bg-black border text-white p-2 text-sm focus:border-primary outline-none transition-colors ${svApplied && spacerConfig.threadHub ? 'border-green-500/50' : 'border-white/20'}`}
                        data-testid="select-thread-hub"
                      />
                      <datalist id="thread-hub-options">
                        <option value="M12x1.25" />
                        <option value="M12x1.5" />
                        <option value="M12x1.75" />
                        <option value="M14x1.25" />
                        <option value="M14x1.5" />
                        <option value="M14x1.75" />
                        <option value="M14x2.0" />
                        <option value='1/2" UNF' />
                        <option value='3/8" UNF' />
                        <option value='7/16" UNF' />
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-tech text-white/70 uppercase">{t('spacer.fixingTypeHub')} *</label>
                      <select
                        value={spacerConfig.fixingType}
                        onChange={(e) => setSpacerConfig(s => ({ ...s, fixingType: e.target.value }))}
                        className={`w-full bg-black border text-white p-2 text-sm focus:border-primary outline-none transition-colors ${svApplied && spacerConfig.fixingType ? 'border-green-500/50' : 'border-white/20'}`}
                        data-testid="select-fixing-type"
                      >
                        <option value="">{t('product.pleaseChoose')}</option>
                        <option value="Bolts (Threaded)">{t('spacer.boltsThreaded')}</option>
                        <option value="Nuts (Studs)">{t('spacer.nutsStuds')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-b border-white/10 pb-1 mb-1 pt-3">
                    <span className="text-[10px] font-tech text-primary/70 uppercase tracking-[0.2em]">{t('spacer.wheelSide')}</span>
                    <span className="text-[10px] font-tech text-white/30 ml-2">({t('spacer.ifDifferent')})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-tech text-white/70 uppercase">{t('spacer.pcdWheel')}</label>
                      <select
                        value={spacerConfig.pcdWheel}
                        onChange={(e) => setSpacerConfig(s => ({ ...s, pcdWheel: e.target.value }))}
                        className="w-full bg-black border border-white/20 text-white p-2 text-sm focus:border-primary outline-none transition-colors"
                        data-testid="select-pcd-wheel"
                      >
                        <option value="">{t('spacer.sameAsHub')}</option>
                        {(() => {
                          const ALL_PCDS = ["3x112","4x95.25","4x98","4x100","4x108","4x110","4x114.3","4x115","5x98","5x100","5x105","5x108","5x110","5x112","5x114.3","5x115","5x118","5x120","5x120.65","5x127","5x130","5x135","5x139.7","5x150","6x114.3","6x115","6x125","6x127","6x130","6x135","6x139.7","6x150"];
                          const hubPcd = spacerConfig.pcdHub;
                          const hubLugs = hubPcd && hubPcd !== "other" ? hubPcd.split("x")[0] : null;
                          const filtered = hubLugs ? ALL_PCDS.filter(p => p.split("x")[0] === hubLugs) : ALL_PCDS;
                          return filtered.map(p => <option key={p}>{p}</option>);
                        })()}
                        <option value="other">{t('spacer.otherPCD')}</option>
                      </select>
                      {spacerConfig.pcdWheel === "other" && (
                        <input
                          type="text"
                          placeholder="e.g. 5x108"
                          value={spacerConfig.pcdWheelCustom}
                          onChange={(e) => setSpacerConfig(s => ({ ...s, pcdWheelCustom: e.target.value }))}
                          className="w-full bg-black border border-primary/40 text-white p-2 text-sm focus:border-primary outline-none transition-colors mt-2"
                          data-testid="input-pcd-wheel-custom"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-tech text-white/70 uppercase">{t('spacer.centerBoreWheel')}</label>
                      <input
                        type="text"
                        placeholder={t('spacer.sameAsHub')}
                        value={spacerConfig.centerBoreWheel}
                        onChange={(e) => setSpacerConfig(s => ({ ...s, centerBoreWheel: e.target.value }))}
                        className="w-full bg-black border border-white/20 text-white p-2 text-sm focus:border-primary outline-none transition-colors"
                        data-testid="input-center-bore-wheel"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-tech text-white/70 uppercase">{t('spacer.threadWheel')}</label>
                      <input
                        list="thread-wheel-options"
                        value={spacerConfig.threadWheel}
                        onChange={(e) => setSpacerConfig(s => ({ ...s, threadWheel: e.target.value }))}
                        placeholder={t('spacer.sameAsHub') || "Same as hub side"}
                        className="w-full bg-black border border-white/20 text-white p-2 text-sm focus:border-primary outline-none transition-colors"
                        data-testid="select-thread-wheel"
                      />
                      <datalist id="thread-wheel-options">
                        <option value="M12x1.25" />
                        <option value="M12x1.5" />
                        <option value="M12x1.75" />
                        <option value="M14x1.25" />
                        <option value="M14x1.5" />
                        <option value="M14x1.75" />
                        <option value="M14x2.0" />
                        <option value='1/2" UNF' />
                        <option value='3/8" UNF' />
                        <option value='7/16" UNF' />
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-tech text-white/70 uppercase">{t('spacer.fixingTypeWheel')}</label>
                      <select
                        value={spacerConfig.fixingTypeWheel}
                        onChange={(e) => setSpacerConfig(s => ({ ...s, fixingTypeWheel: e.target.value }))}
                        className="w-full bg-black border border-white/20 text-white p-2 text-sm focus:border-primary outline-none transition-colors"
                        data-testid="select-fixing-type-wheel"
                      >
                        <option value="">{t('spacer.sameAsHub')}</option>
                        <option value="Bolts (Threaded)">{t('spacer.boltsThreaded')}</option>
                        <option value="Nuts (Studs)">{t('spacer.nutsStuds')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-b border-white/10 pb-1 mb-1 pt-3">
                    <span className="text-[10px] font-tech text-primary/70 uppercase tracking-[0.2em]">{t('spacer.spacerSpec')}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-tech text-white/70 uppercase">{t('spacer.thickness')} *</label>
                    <select
                      value={spacerConfig.thickness}
                      onChange={(e) => setSpacerConfig(s => ({ ...s, thickness: e.target.value }))}
                      className="w-full bg-black border border-white/20 text-white p-2 text-sm focus:border-primary outline-none transition-colors"
                      data-testid="select-thickness"
                    >
                      <option value="">{t('product.pleaseChoose')}</option>
                      <option value="15 mm">15 mm — €159.99</option>
                      <option value="16 mm">16 mm — €159.99</option>
                      <option value="17 mm">17 mm — €159.99</option>
                      <option value="18 mm">18 mm — €159.99</option>
                      <option value="19 mm">19 mm — €159.99</option>
                      <option value="20 mm">20 mm — €179.99</option>
                      <option value="21 mm">21 mm — €179.99</option>
                      <option value="22 mm">22 mm — €179.99</option>
                      <option value="23 mm">23 mm — €179.99</option>
                      <option value="24 mm">24 mm — €179.99</option>
                      <option value="25 mm">25 mm — €181.99</option>
                      <option value="26 mm">26 mm — €181.99</option>
                      <option value="27 mm">27 mm — €181.99</option>
                      <option value="28 mm">28 mm — €181.99</option>
                      <option value="29 mm">29 mm — €181.99</option>
                      <option value="30 mm">30 mm — €183.99</option>
                      <option value="31 mm">31 mm — €183.99</option>
                      <option value="32 mm">32 mm — €183.99</option>
                      <option value="33 mm">33 mm — €183.99</option>
                      <option value="34 mm">34 mm — €183.99</option>
                      <option value="35 mm">35 mm — €189.99</option>
                      <option value="36 mm">36 mm — €189.99</option>
                      <option value="37 mm">37 mm — €189.99</option>
                      <option value="38 mm">38 mm — €189.99</option>
                      <option value="39 mm">39 mm — €189.99</option>
                      <option value="40 mm">40 mm — €193.99</option>
                      <option value="41 mm">41 mm — €193.99</option>
                      <option value="42 mm">42 mm — €193.99</option>
                      <option value="43 mm">43 mm — €193.99</option>
                      <option value="44 mm">44 mm — €193.99</option>
                      <option value="45 mm">45 mm — €204.99</option>
                      <option value="46 mm">46 mm — €204.99</option>
                      <option value="47 mm">47 mm — €204.99</option>
                      <option value="48 mm">48 mm — €204.99</option>
                      <option value="49 mm">49 mm — €204.99</option>
                      <option value="50 mm">50 mm — €207.99</option>
                    </select>
                    <p className="text-[10px] text-white/30 font-tech">{t('spacer.pricePerPair')}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-tech text-white/70 uppercase">{t('spacer.whatCar')}</label>
                      <input
                        type="text"
                        value={spacerConfig.noteCar}
                        onChange={(e) => setSpacerConfig(s => ({ ...s, noteCar: e.target.value }))}
                        className="w-full bg-black border border-white/20 text-white p-2 text-sm focus:border-primary outline-none transition-colors"
                        placeholder={t('spacer.whatCarPlaceholder')}
                        data-testid="input-spacer-car"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-tech text-white/70 uppercase">{t('spacer.whatWheels')}</label>
                      <input
                        type="text"
                        value={spacerConfig.noteWheels}
                        onChange={(e) => setSpacerConfig(s => ({ ...s, noteWheels: e.target.value }))}
                        className="w-full bg-black border border-white/20 text-white p-2 text-sm focus:border-primary outline-none transition-colors"
                        placeholder={t('spacer.whatWheelsPlaceholder')}
                        data-testid="input-spacer-wheels"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/10 p-4 space-y-3">
                  <h5 className="text-[10px] font-tech text-primary/80 uppercase tracking-[0.2em]">{t('spacer.specsTitle')}</h5>
                  <ul className="space-y-1.5 text-xs text-white/60 font-tech">
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{t('spacer.specSoldPerPair')}</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{t('spacer.specNutsIncluded')}</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{t('spacer.specSizes')}</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{t('spacer.specCustomPCD')}</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{t('spacer.specCustomBore')}</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{t('spacer.spec6082')}</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{t('spacer.specPCDConversion')}</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{t('spacer.specSameHoles')}</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Customer Note — only for Lips & Barrels products */}
            {isLipsOrBarrels && (
              <div className="space-y-2">
                <label className="text-white font-tech uppercase tracking-wider text-sm block">
                  {t('product.customerNote') || 'Your wheel model / notes'}
                </label>
                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder={t('product.customerNotePlaceholder') || 'e.g. SSR Professor SP1 — 3-piece 17" front / 18" rear'}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm p-3 min-h-[80px] resize-y placeholder:text-white/30 focus:border-primary focus:outline-none font-mono"
                  data-testid="input-customer-note"
                />
                <p className="text-[10px] text-white/30 font-tech uppercase tracking-wider">
                  {t('product.customerNoteHint') || 'Specify the wheel model you need lips/barrels for'}
                </p>
              </div>
            )}

            {/* Quantity + Actions */}
            <div className="space-y-4">
               {/* Stock status pill */}
               <div>
                 {isPreOrder ? (
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-primary/40 bg-primary/5 text-primary font-tech uppercase tracking-widest text-[10px]" data-testid="text-availability">
                     <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                     {t('product.eligiblePreOrder')}
                   </span>
                 ) : canBuy ? (
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-green-500/40 bg-green-500/5 text-green-400 font-tech uppercase tracking-widest text-[10px]" data-testid="text-availability">
                     <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                     {t('product.inStock')}
                   </span>
                 ) : (
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-red-500/40 bg-red-500/5 text-red-400 font-tech uppercase tracking-widest text-[10px]" data-testid="text-availability">
                     {t('product.soldOut')}
                   </span>
                 )}
               </div>
               <div className="flex items-center gap-4">
                 <span className="text-white font-tech uppercase tracking-wider text-sm">{t('product.quantity')}</span>
                 <div className="flex items-center border border-white/20">
                   <button
                     onClick={() => setQuantity(q => Math.max(1, q - 1))}
                     className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors font-tech text-lg"
                     data-testid="button-quantity-minus"
                   >
                     −
                   </button>
                   <input
                     type="number"
                     min={1}
                     max={maxQty}
                     value={quantity}
                     onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                     className="w-14 h-10 bg-transparent text-white text-center font-tech text-sm border-x border-white/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                     data-testid="input-quantity"
                   />
                   <button
                     onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                     disabled={quantity >= maxQty}
                     className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 transition-colors font-tech text-lg disabled:opacity-30 disabled:cursor-not-allowed"
                     data-testid="button-quantity-plus"
                   >
                     +
                   </button>
                 </div>
               </div>
               {maxQty > 0 && maxQty <= 5 && (
                 <p className="text-xs text-primary/80 font-tech uppercase tracking-wider">
                   {maxQty === 1 ? t('product.lastOne') || "Last one available" : `${maxQty} ${t('product.inStock') || "in stock"}`}
                 </p>
               )}
               <Button 
                 size="lg" 
                 className="w-full h-14 bg-primary text-primary-foreground hover:bg-white hover:text-black font-tech uppercase tracking-widest text-lg rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                 onClick={handleAddToCart}
                 disabled={!canBuy || isUpdating}
                 data-testid="button-add-to-cart"
               >
                 {isUpdating ? (
                   <Loader2 className="h-5 w-5 animate-spin" />
                 ) : canBuy ? t('product.addToCart') : t('product.soldOut')}
               </Button>
               {canBuy && !isSpacer && (
                 <p className={`flex items-center justify-center gap-2 text-sm font-tech uppercase tracking-wider ${(isPreOrder || isBcRacingProduct || isLipsOrBarrels) ? 'text-primary' : 'text-green-400'}`} data-testid="text-shipped-24h">
                   <Truck className="w-4 h-4" />
                   {isPreOrder ? t('product.preOrderDelivery') : isBcRacingProduct ? t('product.madeToOrder') : isLipsOrBarrels ? t('product.lipsBarrelsLeadTime') : t('product.shippedWithin24h')}
                 </p>
               )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 py-6">
              <div className="flex items-center gap-3 text-sm text-white/80">
                 <Truck className="w-5 h-5 text-primary" />
                 <span>{t('product.fastShipping')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80">
                 <Package className="w-5 h-5 text-primary" />
                 <span>{t('product.securePackaging')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80">
                 <ShieldCheck className="w-5 h-5 text-primary" />
                 <span>{t('product.authenticityGuaranteed')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80">
                 <Info className="w-5 h-5 text-primary" />
                 <span>{t('product.expertSupport')}</span>
              </div>
            </div>


            <ProductDescription
              descriptionHtml={product.descriptionHtml}
              description={product.description}
              wheelSpecs={isWheel ? wheelSpecs : null}
            />

          </div>
        </div>
      </div>

      <BrandStory productTitle={product.title} />

      <AuthenticityBlock />

      {showVisualizer && singleWheelImage && (
        <WheelVisualizer
          wheelImageUrl={singleWheelImage}
          productTitle={product.title}
          onClose={() => setShowVisualizer(false)}
          onAddToCart={canBuy ? () => {
            if (selectedVariant?.id) {
              addItem(selectedVariant.id, quantity);
            }
          } : undefined}
          productPrice={canBuy ? formatPrice(price) : undefined}
          isAddingToCart={isUpdating}
        />
      )}
    </div>
  );
}
