export type WheelSpecSource = "description" | "title";

export type WheelSpecs = {
  diameter: number | null;
  widthFront: number | null;
  widthRear: number | null;
  widthUnassigned: number[];
  offsetFront: number | null;
  offsetRear: number | null;
  offsetShared: number | null;
  offsetUnassigned: number[];
  pcd: string | null;
  isStaggered: boolean;
  source: Partial<Record<"diameter" | "width" | "offset" | "pcd", WheelSpecSource>>;
  ambiguous: string[];
};

type Candidate = {
  value: number;
  index: number;
  end: number;
  axle: "front" | "rear" | null;
};

type ParsedField<T> = {
  value: T;
  found: boolean;
  ambiguous: boolean;
};

const EMPTY_NUMBER: ParsedField<number | null> = {
  value: null,
  found: false,
  ambiguous: false,
};

const toNumber = (value: string): number =>
  Number.parseFloat(value.replace(",", ".").replace(/\s/g, ""));

const allMatches = (text: string, pattern: RegExp): RegExpMatchArray[] =>
  Array.from(text.matchAll(pattern));

function normalizeText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/[×✕]/g, "x")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/j(?=et\s*[+-]?\d)/gi, "j ")
    .replace(/pcd/gi, " pcd ")
    .replace(/front/gi, " front ")
    .replace(/rear/gi, " rear ")
    .replace(/all\s*round/gi, " all around ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Prefer the merchant's explicit Specs/Specifications block. This avoids
 * accidentally choosing measurements mentioned in introductory prose.
 */
function extractSpecsText(description: string): string {
  const text = normalizeText(description);
  const marker = /\b(?:specs|specifications?)\s*[:：]/gi;
  const matches = allMatches(text, marker);
  if (!matches.length) return text;

  const last = matches[matches.length - 1];
  const start = (last.index ?? 0) + last[0].length;
  return text
    .slice(start)
    .split(/\b(?:why juju|trade-in|price)\b|€|💰/i)[0]
    .trim();
}

function axleNear(text: string, start: number, end: number): "front" | "rear" | null {
  const before = text.slice(Math.max(0, start - 32), start);
  const after = text.slice(end, Math.min(text.length, end + 36));

  const directAfter = after.match(
    /^\s*[\])},;:\-]*\s*\(?\s*(front|rear)\b(?!\s*:)/i,
  );
  if (directAfter) return directAfter[1].toLowerCase() as "front" | "rear";

  const beforeMatch = before.match(/\b(front|rear)\s*[:\-]?\s*(?:\d{2}\s*(?:inch|x)\s*)?$/i);
  if (beforeMatch) {
    const beforeLabel = before.slice(0, beforeMatch.index);
    // In "18x9.5 ET38 rear18x8.5 ET28 front", the rear label belongs
    // to the preceding size. Do not attach it to the size that follows.
    if (!/(?:\bet\s*[+-]?\s*\d{1,3}|[+-]\s*\d{1,3}(?:\s*offset)?)\s*$/i.test(beforeLabel)) {
      return beforeMatch[1].toLowerCase() as "front" | "rear";
    }
  }

  // Some compact listings put the axle after its offset:
  // "18x9.5 ET38 rear" or "9.5J +40 offset rear".
  const afterOffset = after.match(
    /^\s*(?:(?:et\s*)?[+-]?\s*\d{1,3}\s*(?:offset)?)[\s),;:\-]*\s*(front|rear)\b/i,
  );
  if (afterOffset) return afterOffset[1].toLowerCase() as "front" | "rear";

  // Axle prefixes can start a complete block: "Front: 19x8.5J ET28".
  // The offset is not adjacent to "Front", but it remains explicitly inside
  // that labelled block.
  const blockBefore = before.match(
    /\b(front|rear)\b\s*:?\s*(?:\d{2}\s*(?:inch|x)\s*)?\d{1,2}(?:\.\d+)?\s*j?(?:\s*wide)?\s*$/i,
  );
  if (blockBefore) return blockBefore[1].toLowerCase() as "front" | "rear";

  if (beforeMatch) return beforeMatch[1].toLowerCase() as "front" | "rear";

  return null;
}

function addCandidate(
  candidates: Candidate[],
  text: string,
  value: number,
  index: number,
  end: number,
): void {
  if (!Number.isFinite(value)) return;
  const overlaps = candidates.some(
    (candidate) => index < candidate.end && end > candidate.index,
  );
  if (overlaps) return;
  candidates.push({ value, index, end, axle: axleNear(text, index, end) });
}

function resolveAxleCandidates(
  candidates: Candidate[],
): {
  front: number | null;
  rear: number | null;
  found: boolean;
  ambiguous: boolean;
  unassigned: number[];
} {
  if (!candidates.length) {
    return { front: null, rear: null, found: false, ambiguous: false, unassigned: [] };
  }

  const ordered = [...candidates].sort((a, b) => a.index - b.index);
  const frontValues = Array.from(new Set(ordered.filter((c) => c.axle === "front").map((c) => c.value)));
  const rearValues = Array.from(new Set(ordered.filter((c) => c.axle === "rear").map((c) => c.value)));
  const unlabeled = ordered.filter((c) => c.axle === null);

  if (frontValues.length > 1 || rearValues.length > 1) {
    return { front: null, rear: null, found: true, ambiguous: true, unassigned: [] };
  }

  let front = frontValues[0] ?? null;
  let rear = rearValues[0] ?? null;

  if (front !== null && rear !== null) {
    return { front, rear, found: true, ambiguous: false, unassigned: [] };
  }

  const unlabeledValues = unlabeled.map((candidate) => candidate.value);
  const uniqueUnlabeled = Array.from(new Set(unlabeledValues));

  if (front !== null || rear !== null) {
    const known = front ?? rear;
    const otherValues = uniqueUnlabeled.filter((value) => value !== known);
    if (otherValues.length > 1) {
      return { front: null, rear: null, found: true, ambiguous: true, unassigned: otherValues };
    }
    if (front === null) front = otherValues[0] ?? null;
    if (rear === null) rear = otherValues[0] ?? null;
    return { front, rear, found: true, ambiguous: false, unassigned: [] };
  }

  if (uniqueUnlabeled.length === 1) {
    return {
      front: uniqueUnlabeled[0],
      rear: uniqueUnlabeled[0],
      found: true,
      ambiguous: false,
      unassigned: [],
    };
  }

  // The reviewed Shopify catalogue convention for exactly two complete
  // unlabelled values is front first, rear second. Preserve source order;
  // never sort because a front can legitimately be wider than a rear.
  if (unlabeledValues.length === 2) {
    return {
      front: unlabeledValues[0],
      rear: unlabeledValues[1],
      found: true,
      ambiguous: false,
      unassigned: [],
    };
  }

  // More than two unlabelled values cannot describe one fixed axle pair.
  return {
    front: null,
    rear: null,
    found: true,
    ambiguous: true,
    unassigned: uniqueUnlabeled,
  };
}

function parseDiameter(text: string): ParsedField<number | null> {
  const values: number[] = [];

  for (const match of allMatches(text, /\b(1[3-9]|2[0-2])\s*(?:inch|["″])/gi)) {
    values.push(Number.parseInt(match[1], 10));
  }
  for (const match of allMatches(text,
    /\b(1[3-9]|2[0-2])\s*x\s*(\d{1,2}(?:\.\d+)?)\s*(?:j\b)?/gi,
  )) {
    const width = toNumber(match[2]);
    if (width >= 3 && width <= 15) values.push(Number.parseInt(match[1], 10));
  }

  // Explicit multi-size listings such as "18/19/20 inch" are intentionally
  // unresolved: the product has options, not one factual diameter.
  for (const match of allMatches(text,
    /\b((?:1[3-9]|2[0-2])(?:\s*[/–—-]\s*(?:1[3-9]|2[0-2]))+)\s*inch/gi,
  )) {
    for (const value of match[1].match(/\d{2}/g) ?? []) {
      values.push(Number.parseInt(value, 10));
    }
  }

  const unique = Array.from(new Set(values));
  if (!unique.length) return EMPTY_NUMBER;
  if (unique.length > 1) return { value: null, found: true, ambiguous: true };
  return { value: unique[0], found: true, ambiguous: false };
}

function parseWidths(text: string) {
  const candidates: Candidate[] = [];

  for (const match of allMatches(text,
    /\b(1[3-9]|2[0-2])\s*x\s*(\d{1,2}(?:\.\d+)?)\s*(?:j(?=et\b|[^a-z0-9.]|$))?/gi,
  )) {
    const value = toNumber(match[2]);
    if (value < 3 || value > 15) continue;
    const index = match.index ?? 0;
    addCandidate(candidates, text, value, index, index + match[0].length);
  }

  for (const match of allMatches(text,
    /(?<![\d.])(\d{1,2}(?:\.\d+)?)\s*j(?=et\b|[^a-z0-9.]|$)/gi,
  )) {
    const value = toNumber(match[1]);
    if (value < 3 || value > 15) continue;
    const index = match.index ?? 0;
    addCandidate(candidates, text, value, index, index + match[0].length);
  }

  // A few Shopify descriptions omit J but retain the structured "inch | width"
  // form. It is safe because both the diameter unit and separator are present.
  for (const match of allMatches(text,
    /\b(?:1[3-9]|2[0-2])\s*inch\s*\|\s*(\d{1,2}(?:\.\d+)?)(?=\s*(?:✅|et(?=\s*[+-]?\d)|\||$))/gi,
  )) {
    const value = toNumber(match[1]);
    if (value < 3 || value > 15) continue;
    const index = match.index ?? 0;
    addCandidate(candidates, text, value, index, index + match[0].length);
  }

  return {
    ...resolveAxleCandidates(candidates),
    singleUnlabeled: candidates.length === 1 && candidates[0].axle === null,
  };
}

function addOffsetCandidate(
  candidates: Candidate[],
  text: string,
  rawValue: string,
  index: number,
  end: number,
): void {
  const value = Number.parseInt(rawValue.replace(/\s/g, ""), 10);
  if (value < -100 || value > 100) return;
  addCandidate(candidates, text, value, index, end);
}

function parseOffsets(text: string) {
  const candidates: Candidate[] = [];
  const occupied: Array<[number, number]> = [];

  const addPair = (
    match: RegExpMatchArray,
    first: string,
    second: string,
    firstAxle?: "front" | "rear",
    secondAxle?: "front" | "rear",
  ) => {
    const index = match.index ?? 0;
    const splitAt = match[0].indexOf(second, Math.max(1, match[0].indexOf(first) + first.length));
    const firstCandidate: Candidate = {
      value: Number.parseInt(first.replace(/\s/g, ""), 10),
      index,
      end: index + Math.max(1, splitAt),
      axle: firstAxle ?? null,
    };
    const secondStart = index + Math.max(0, splitAt);
    const secondCandidate: Candidate = {
      value: Number.parseInt(second.replace(/\s/g, ""), 10),
      index: secondStart,
      end: secondStart + second.length,
      axle: secondAxle ?? null,
    };
    if (
      Number.isFinite(firstCandidate.value) &&
      Number.isFinite(secondCandidate.value) &&
      Math.abs(firstCandidate.value) <= 100 &&
      Math.abs(secondCandidate.value) <= 100
    ) {
      candidates.push(firstCandidate, secondCandidate);
      occupied.push([index, index + match[0].length]);
    }
  };

  for (const match of allMatches(text,
    /\bet\s*([+-]?\s*\d{1,3})\s*\/\s*(?:et\s*)?([+-]?\s*\d{1,3})\b/gi,
  )) {
    addPair(match, match[1], match[2]);
  }

  for (const match of allMatches(text,
    /\bet\s*([+-]?\s*\d{1,3})\s*\(?\s*front\b[\s),;:\-]*(?:et\s*)?([+-]?\s*\d{1,3})\s*\(?\s*rear\b/gi,
  )) {
    addPair(match, match[1], match[2], "front", "rear");
  }

  for (const match of allMatches(text, /\bet\s*([+-]?\s*\d{1,3})\b/gi)) {
    const index = match.index ?? 0;
    const end = index + match[0].length;
    if (occupied.some(([start, stop]) => index >= start && end <= stop)) continue;
    addOffsetCandidate(candidates, text, match[1], index, end);
  }

  // Compact shorthand: "17x9 +22" or "17 x 8 +42 front".
  for (const match of allMatches(text,
    /\b(?:1[3-9]|2[0-2])\s*x\s*\d{1,2}(?:\.\d+)?\s*(?:j\s*)?([+-]\s*\d{1,3})\b/gi,
  )) {
    const index = (match.index ?? 0) + match[0].lastIndexOf(match[1]);
    addOffsetCandidate(candidates, text, match[1], index, index + match[1].length);
  }

  // Other compact shorthand: "9.5J +40 offset".
  for (const match of allMatches(text,
    /\b\d{1,2}(?:\.\d+)?\s*j\s*([+-]\s*\d{1,3})\s*offset\b/gi,
  )) {
    const index = (match.index ?? 0) + match[0].indexOf(match[1]);
    addOffsetCandidate(candidates, text, match[1], index, index + match[1].length);
  }

  return {
    ...resolveAxleCandidates(candidates),
    singleUnlabeled: candidates.length === 1 && candidates[0].axle === null,
  };
}

function normalizePcd(value: string): string {
  const compact = value.replace(/\s/g, "").replace(/×/g, "x").toLowerCase();
  if (compact === "centerlock") return "Centerlock";
  if (compact === "universal") return "Universal";
  return compact.replace("x", "x");
}

function parsePcd(text: string): ParsedField<string | null> {
  if (/\b(?:pcd\s*[:\-]?\s*)?center\s*lock\b/i.test(text)) {
    return { value: "Centerlock", found: true, ambiguous: false };
  }
  if (/\buniversal(?:\s+fit)?\s*(?:pcd|bolt pattern)?\b/i.test(text)) {
    return { value: "Universal", found: true, ambiguous: false };
  }

  const labelled: string[] = [];
  for (const match of allMatches(text,
    /\b(?:pcd\s*[:\-]?\s*|bolt\s*pattern\s*[:\-]\s*)((?:[3-8]\s*\/\s*)?[3-8]\s*x\s*\d{2,3}(?:\.\d+)?)(?!\d|\.\d)/gi,
  )) {
    labelled.push(normalizePcd(match[1]));
  }
  // PCD is often written after the value: "5x114.3 PCD".
  for (const match of allMatches(text,
    /(?<![\d/])((?:[3-8]\s*\/\s*)?[3-8]\s*x\s*\d{2,3}(?:\.\d+)?)(?!\d|\.\d)\s*pcd\b/gi,
  )) {
    labelled.push(normalizePcd(match[1]));
  }

  const generic: string[] = [];
  for (const match of allMatches(text,
    /(?<![\d/])((?:[3-8]\s*\/\s*)?[3-8]\s*x\s*\d{2,3}(?:\.\d+)?)(?!\d|\.\d)/gi,
  )) {
    generic.push(normalizePcd(match[1]));
  }

  const values = Array.from(new Set(labelled.length ? labelled : generic));
  if (!values.length) return { value: null, found: false, ambiguous: false };
  if (values.length > 1) return { value: null, found: true, ambiguous: true };
  return { value: values[0], found: true, ambiguous: false };
}

function useDescriptionOrTitle<T>(
  description: ParsedField<T>,
  title: ParsedField<T>,
): { field: ParsedField<T>; source?: WheelSpecSource } {
  if (description.found) return { field: description, source: "description" };
  if (title.found) return { field: title, source: "title" };
  return { field: description };
}

export function parseWheelSpecs(input: {
  title?: string | null;
  description?: string | null;
}): WheelSpecs {
  const descriptionText = extractSpecsText(input.description ?? "");
  const titleText = normalizeText(input.title ?? "");

  const diameterResult = useDescriptionOrTitle(
    parseDiameter(descriptionText),
    parseDiameter(titleText),
  );
  const widthDescription = parseWidths(descriptionText);
  const widthTitle = parseWidths(titleText);
  const widthResult =
    widthDescription.found || widthDescription.ambiguous
      ? { field: widthDescription, source: "description" as const }
      : widthTitle.found
        ? { field: widthTitle, source: "title" as const }
        : { field: widthDescription, source: undefined };
  const offsetDescription = parseOffsets(descriptionText);
  const offsetTitle = parseOffsets(titleText);
  const offsetResult =
    offsetDescription.found || offsetDescription.ambiguous
      ? { field: offsetDescription, source: "description" as const }
      : offsetTitle.found
        ? { field: offsetTitle, source: "title" as const }
        : { field: offsetDescription, source: undefined };
  const pcdResult = useDescriptionOrTitle(parsePcd(descriptionText), parsePcd(titleText));

  const ambiguous: string[] = [];
  if (diameterResult.field.ambiguous) ambiguous.push("diameter");
  if (widthResult.field.ambiguous) ambiguous.push("width");
  if (offsetResult.field.ambiguous) ambiguous.push("offset");
  if (pcdResult.field.ambiguous) ambiguous.push("pcd");

  const widthFront = widthResult.field.front ?? null;
  const widthRear = widthResult.field.rear ?? null;
  const widthUnassigned = widthResult.field.unassigned;
  const widthsAreStaggered =
    (widthFront !== null && widthRear !== null && widthFront !== widthRear) ||
    widthUnassigned.length > 1;
  const offsetIsSharedOnly =
    widthsAreStaggered &&
    offsetResult.field.singleUnlabeled &&
    offsetResult.field.front !== null;
  const offsetShared = offsetIsSharedOnly ? offsetResult.field.front : null;
  const offsetFront = offsetIsSharedOnly ? null : (offsetResult.field.front ?? null);
  const offsetRear = offsetIsSharedOnly ? null : (offsetResult.field.rear ?? null);
  const offsetUnassigned = offsetResult.field.unassigned;

  return {
    diameter: diameterResult.field.value,
    widthFront,
    widthRear,
    widthUnassigned,
    offsetFront,
    offsetRear,
    offsetShared,
    offsetUnassigned,
    pcd: pcdResult.field.value,
    isStaggered:
      widthsAreStaggered ||
      offsetUnassigned.length > 1 ||
      (offsetFront !== null && offsetRear !== null && offsetFront !== offsetRear),
    source: {
      ...(diameterResult.source ? { diameter: diameterResult.source } : {}),
      ...(widthResult.source ? { width: widthResult.source } : {}),
      ...(offsetResult.source ? { offset: offsetResult.source } : {}),
      ...(pcdResult.source ? { pcd: pcdResult.source } : {}),
    },
    ambiguous,
  };
}

export function formatWheelWidth(
  front: number | null,
  rear: number | null,
  unassigned: number[] = [],
): string | null {
  if (unassigned.length) return unassigned.map((value) => `${value}J`).join(" / ");
  if (front === null) return null;
  if (rear !== null && rear !== front) return `${front}J / ${rear}J`;
  return `${front}J`;
}

export function formatWheelOffset(
  front: number | null,
  rear: number | null,
  shared: number | null = null,
  unassigned: number[] = [],
): string | null {
  const format = (value: number) => `ET${value > 0 ? "+" : ""}${value}`;
  if (unassigned.length) return unassigned.map(format).join(" / ");
  if (shared !== null) return format(shared);
  if (front === null) return null;
  if (rear !== null && rear !== front) return `${format(front)} / ${format(rear)}`;
  return format(front);
}