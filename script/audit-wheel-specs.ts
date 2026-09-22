import { readFile, writeFile } from "node:fs/promises";
import { parseWheelSpecs } from "../client/src/lib/wheelSpecs";

type CatalogueProduct = {
  handle: string;
  title: string;
  description: string;
};

const baseUrl = process.env.WHEEL_AUDIT_BASE_URL || "http://127.0.0.1:5000";
const response = await fetch(`${baseUrl}/api/all-wheels`);
if (!response.ok) {
  throw new Error(`Wheel catalogue request failed: ${response.status} ${response.statusText}`);
}

const products = (await response.json()) as CatalogueProduct[];
const rows = products.map((product) => ({
  product,
  specs: parseWheelSpecs(product),
}));

const value = (input: string | number | null) => input ?? "";
const signature = ({ product, specs }: (typeof rows)[number]) =>
  [
    product.handle,
    value(specs.diameter),
    value(specs.widthFront),
    value(specs.widthRear),
    value(specs.offsetFront),
    value(specs.offsetRear),
    value(specs.offsetShared),
    value(specs.pcd),
    specs.ambiguous.join(","),
  ].join("|");

const expectationText = await readFile(
  new URL("./wheel-spec-expectations.txt", import.meta.url),
  "utf8",
);
const expectedByHandle = new Map(
  expectationText.trim().split("\n").map((line) => [line.split("|", 1)[0], line]),
);
const actualByHandle = new Map(rows.map((row) => [row.product.handle, signature(row)]));
const baselineErrors = [
  ...rows
    .filter(({ product }) => !expectedByHandle.has(product.handle))
    .map(({ product }) => `Unreviewed catalogue product: ${product.handle}`),
  ...Array.from(expectedByHandle.keys())
    .filter((handle) => !actualByHandle.has(handle))
    .map((handle) => `Reviewed product missing from catalogue: ${handle}`),
  ...rows
    .filter((row) => {
      const expected = expectedByHandle.get(row.product.handle);
      return expected !== undefined && expected !== signature(row);
    })
    .map((row) => [
      `Parsed specs changed for ${row.product.handle}`,
      `  expected: ${expectedByHandle.get(row.product.handle)}`,
      `  actual:   ${signature(row)}`,
    ].join("\n")),
];

const cell = (value: string | number | null) =>
  value === null ? "—" : String(value).replace(/\|/g, "\\|");
const axle = (
  front: number | null,
  rear: number | null,
  shared: number | null = null,
  unassigned: number[] = [],
) => {
  if (unassigned.length) return `${unassigned.join(" / ")} (axle unspecified)`;
  if (shared !== null) return `${shared} (axle unspecified)`;
  if (front === null && rear === null) return "—";
  return `${cell(front)} / ${cell(rear)}`;
};

const lines = [
  "# Wheel specification audit",
  "",
  `Generated from ${products.length} live Shopify catalogue records.`,
  `Reviewed baseline validation: ${baselineErrors.length ? "FAIL" : "PASS"}.`,
  "",
  "| Handle | Diameter | Width F/R | Offset F/R | PCD | Source notes | Shopify source text |",
  "|---|---:|---:|---:|---|---|---|",
  ...rows.map(({ product, specs }) => {
    const notes = [
      ...Object.entries(specs.source).map(([field, source]) => `${field}: ${source}`),
      ...specs.ambiguous.map((field) => `${field}: ambiguous`),
    ].join("; ");
    const source = product.description.replace(/\s+/g, " ").trim();
    return `| ${product.handle} | ${cell(specs.diameter)} | ${axle(specs.widthFront, specs.widthRear, null, specs.widthUnassigned)} | ${axle(specs.offsetFront, specs.offsetRear, specs.offsetShared, specs.offsetUnassigned)} | ${cell(specs.pcd)} | ${notes} | ${cell(source)} |`;
  }),
  "",
  "## Review queue",
  "",
  ...rows
    .filter(({ specs }) => specs.ambiguous.length > 0)
    .map(({ product, specs }) => `- **${product.handle}:** ambiguous ${specs.ambiguous.join(", ")}`),
  ...rows
    .filter(({ specs }) => specs.widthFront === null || (specs.offsetFront === null && specs.offsetShared === null))
    .map(({ product, specs }) => {
      const missing = [
        specs.widthFront === null ? "width" : null,
        specs.offsetFront === null && specs.offsetShared === null ? "offset" : null,
      ].filter(Boolean);
      return `- **${product.handle}:** missing ${missing.join(", ")}`;
    }),
  "",
];

const report = lines.join("\n");
const outputArg = process.argv.find((argument) => argument.startsWith("--output="));
if (outputArg) {
  const outputPath = outputArg.slice("--output=".length);
  await writeFile(outputPath, report);
  console.log(`Wrote ${products.length}-product audit to ${outputPath}`);
} else {
  console.log(report);
}

if (baselineErrors.length) {
  throw new Error(`Wheel catalogue audit failed:\n${baselineErrors.join("\n")}`);
}
