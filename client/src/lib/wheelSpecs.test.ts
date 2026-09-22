import assert from "node:assert/strict";
import test from "node:test";
import { parseWheelSpecs } from "./wheelSpecs";

type Expected = Partial<ReturnType<typeof parseWheelSpecs>>;

const cases: Array<{
  name: string;
  title?: string;
  description: string;
  expected: Expected;
}> = [
  {
    name: "standard labelled square set with decimal comma",
    description: "Specs: 15 inch | 7,5J ET30 PCD 5x114.3",
    expected: { diameter: 15, widthFront: 7.5, widthRear: 7.5, offsetFront: 30, offsetRear: 30, pcd: "5x114.3" },
  },
  {
    name: "Specs block wins over contradictory introductory prose and title",
    title: "Example wheel 17 inch",
    description: "A rare 14 inch-style design. Specs: 15 inch | 9J ET50 PCD centerlock",
    expected: { diameter: 15, widthFront: 9, widthRear: 9, offsetFront: 50, offsetRear: 50, pcd: "Centerlock" },
  },
  {
    name: "front and rear offsets with square widths",
    description: "Specs: 16 inch | 7.5J all around ET32 (front) ET38 (rear) PCD 4x100",
    expected: { widthFront: 7.5, widthRear: 7.5, offsetFront: 32, offsetRear: 38, isStaggered: true },
  },
  {
    name: "two unlabelled widths retain reviewed catalogue source order",
    description: "17 inch | 7J 8J ET36 PCD 5x114.3",
    expected: { widthFront: 7, widthRear: 8 },
  },
  {
    name: "single offset on staggered widths remains unassigned",
    description: "18 inch | 8.5J 9.5J ET35 PCD 5x114.3",
    expected: { widthFront: 8.5, widthRear: 9.5, offsetFront: null, offsetRear: null, offsetShared: 35 },
  },
  {
    name: "compact square size with signed offset",
    description: "Square set. 17x9 +22 all around PCD 5x114.3",
    expected: { diameter: 17, widthFront: 9, widthRear: 9, offsetFront: 22, offsetRear: 22, pcd: "5x114.3" },
  },
  {
    name: "compact staggered sizes with axle labels",
    description: "17 x 8 + 42 front17 x 9 +45 rear5x114.3 PCD",
    expected: { diameter: 17, widthFront: 8, widthRear: 9, offsetFront: 42, offsetRear: 45, pcd: "5x114.3" },
  },
  {
    name: "J and ET may be joined without whitespace",
    title: "Panasport G7 17 inch 5x114.3",
    description: "17 inch9jet22 allround",
    expected: { diameter: 17, widthFront: 9, widthRear: 9, offsetFront: 22, offsetRear: 22, pcd: "5x114.3" },
  },
  {
    name: "rear-first compact description is assigned by labels",
    description: "18x9.5 et38 rear18x8.5 et28 front5x114.3 PCD",
    expected: { widthFront: 8.5, widthRear: 9.5, offsetFront: 28, offsetRear: 38 },
  },
  {
    name: "bullet front and rear format",
    description: "Specifications: • Front: 19x8.5J ET28 • Rear: 19x9.5J ET30 • Bolt pattern: 5x114.3",
    expected: { diameter: 19, widthFront: 8.5, widthRear: 9.5, offsetFront: 28, offsetRear: 30, pcd: "5x114.3" },
  },
  {
    name: "width and signed offset after axle prefix",
    description: "front19 inch9.5J +40 offsetrear19 inch 10.5J+23 offset",
    expected: { widthFront: 9.5, widthRear: 10.5, offsetFront: 40, offsetRear: 23 },
  },
  {
    name: "slash-separated offsets follow reviewed front-then-rear convention",
    description: "19 inch | 8.5J (front) 10J (rear) ET43/41 PCD 5x114.3",
    expected: { offsetFront: 43, offsetRear: 41 },
  },
  {
    name: "second labelled offset may omit ET",
    description: "18 inch | 8.5J 9.5J ET35 (front) 40 (rear) PCD 5x114.3",
    expected: { offsetFront: 35, offsetRear: 40 },
  },
  {
    name: "malformed rear parenthesis still preserves pair",
    description: "19 inch | 8.5J 9.5J ET32 (front) 36 (rear! PCD 5x120",
    expected: { offsetFront: 32, offsetRear: 36 },
  },
  {
    name: "dual-drill PCD is not collapsed",
    description: "18 inch | 9.75J (front) 10J (rear) ET2 (front) ET3 (rear) PCD 4/5x114.3",
    expected: { pcd: "4/5x114.3" },
  },
  {
    name: "wheel dimensions are never mistaken for PCD",
    description: "17x9 +22 all around",
    expected: { pcd: null },
  },
  {
    name: "negative and zero offsets are preserved",
    description: "Front: 18x9J ET-12 Rear: 18x10J ET0 PCD 5x114.3",
    expected: { offsetFront: -12, offsetRear: 0 },
  },
  {
    name: "structured pipe width may omit J",
    description: "Specs: 18 inch | 8,5 ET38 PCD 5x114.3",
    expected: { widthFront: 8.5, widthRear: 8.5 },
  },
  {
    name: "PCD can directly follow the inch unit",
    description: "8J ET34 18 inch5x114.3 PCD",
    expected: { pcd: "5x114.3" },
  },
  {
    name: "two complete unlabelled sizes use reviewed front-first catalogue convention",
    description: "5x114.3 19x8.5 ET30 19x9 ET24",
    expected: { widthFront: 8.5, widthRear: 9, offsetFront: 30, offsetRear: 24 },
  },
  {
    name: "decimal PCD accepts sentence punctuation",
    description: "Specs: 18 inch | 8.5J ET35 PCD 5x114.3.",
    expected: { pcd: "5x114.3" },
  },
  {
    name: "made-to-order ranges remain ambiguous",
    title: "Work Rezax 2 18/19/20inch 5x112/5x114.3/5x120",
    description: "Available in 5x112 / 5x114.3 / 5x120 bolt patterns and sizes 18–20 inch.",
    expected: { diameter: null, pcd: null, ambiguous: ["diameter", "pcd"] },
  },
  {
    name: "description PCD overrides a conflicting title PCD",
    title: "Example 18 inch 5x114.3",
    description: "Specs: 18 inch | 7.5J ET45 PCD 5x100",
    expected: { pcd: "5x100", source: { diameter: "description", width: "description", offset: "description", pcd: "description" } },
  },
  {
    name: "title is a lower-confidence fallback for a missing PCD",
    title: "Example 17 inch 5x114.3",
    description: "17 inch 8J ET35",
    expected: { pcd: "5x114.3", source: { diameter: "description", width: "description", offset: "description", pcd: "title" } },
  },
  {
    name: "universal accessory fit is explicit but has no invented wheel dimensions",
    description: "Universal PCD. Fits all 18 inch wheels.",
    expected: { diameter: 18, widthFront: null, offsetFront: null, pcd: "Universal" },
  },
];

for (const fixture of cases) {
  test(fixture.name, () => {
    const actual = parseWheelSpecs({
      title: fixture.title,
      description: fixture.description,
    });
    for (const [key, expected] of Object.entries(fixture.expected)) {
      assert.deepEqual(actual[key as keyof typeof actual], expected, `${fixture.name}: ${key}`);
    }
  });
}
