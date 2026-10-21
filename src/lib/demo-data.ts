// Preview catalogue. It is used only while the store has no active products,
// so the redesigned storefront can be reviewed before the owner supplies
// photos, prices and stock. Every surface that uses it shows a "Preview"
// notice. Once a real active product exists this file is ignored.

export interface DemoVariant {
  id: string;
  size: string;
  color: string | null;
  stock: number;
}

export interface DemoProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: { name: string; slug: string };
  priceKobo: number;
  compareAtPriceKobo: number | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  variants: DemoVariant[];
}

const sizes = ["S", "M", "L", "XL"] as const;

function variants(prefix: string, stock: number[]): DemoVariant[] {
  return sizes.map((size, index) => ({
    id: `${prefix}-${size.toLowerCase()}`,
    size,
    color: null,
    stock: stock[index] ?? 0,
  }));
}

export const demoProducts: DemoProduct[] = [
  {
    id: "demo-heavyweight-hoodie",
    name: "Heavyweight Hoodie",
    slug: "heavyweight-hoodie",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Hoodies", slug: "hoodies" },
    priceKobo: 2500000,
    compareAtPriceKobo: 3000000,
    isFeatured: true,
    isNewArrival: true,
    variants: variants("demo-hoodie", [3, 5, 4, 2]),
  },
  {
    id: "demo-boxy-zip-hoodie",
    name: "Boxy Zip Hoodie",
    slug: "boxy-zip-hoodie",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Hoodies", slug: "hoodies" },
    priceKobo: 2700000,
    compareAtPriceKobo: null,
    isFeatured: false,
    isNewArrival: true,
    variants: variants("demo-zip", [2, 3, 3, 0]),
  },
  {
    id: "demo-oversized-crewneck",
    name: "Oversized Crewneck",
    slug: "oversized-crewneck",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Sweatshirts", slug: "sweatshirts" },
    priceKobo: 2200000,
    compareAtPriceKobo: null,
    isFeatured: true,
    isNewArrival: true,
    variants: variants("demo-crew", [4, 6, 5, 3]),
  },
  {
    id: "demo-vintage-sweatshirt",
    name: "Vintage Wash Sweatshirt",
    slug: "vintage-wash-sweatshirt",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Sweatshirts", slug: "sweatshirts" },
    priceKobo: 2300000,
    compareAtPriceKobo: 2600000,
    isFeatured: false,
    isNewArrival: true,
    variants: variants("demo-vintage", [0, 2, 2, 1]),
  },
  {
    id: "demo-tapered-joggers",
    name: "Tapered Joggers",
    slug: "tapered-joggers",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Joggers", slug: "joggers" },
    priceKobo: 1800000,
    compareAtPriceKobo: 2200000,
    isFeatured: true,
    isNewArrival: true,
    variants: variants("demo-tapered", [5, 4, 3, 2]),
  },
  {
    id: "demo-relaxed-joggers",
    name: "Relaxed Joggers",
    slug: "relaxed-joggers",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Joggers", slug: "joggers" },
    priceKobo: 1900000,
    compareAtPriceKobo: null,
    isFeatured: false,
    isNewArrival: true,
    variants: variants("demo-relaxed", [2, 2, 0, 0]),
  },
  {
    id: "demo-heavy-sweatpants",
    name: "Heavy Sweatpants",
    slug: "heavy-sweatpants",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Sweatpants", slug: "sweatpants" },
    priceKobo: 2000000,
    compareAtPriceKobo: null,
    isFeatured: true,
    isNewArrival: false,
    variants: variants("demo-sweatpants", [0, 0, 0, 0]),
  },
  {
    id: "demo-wide-leg-sweatpants",
    name: "Wide-Leg Sweatpants",
    slug: "wide-leg-sweatpants",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Sweatpants", slug: "sweatpants" },
    priceKobo: 2100000,
    compareAtPriceKobo: null,
    isFeatured: false,
    isNewArrival: false,
    variants: variants("demo-wide", [3, 4, 2, 1]),
  },
  {
    id: "demo-denim-jorts",
    name: "Denim Jorts",
    slug: "denim-jorts",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Jorts", slug: "jorts" },
    priceKobo: 1600000,
    compareAtPriceKobo: null,
    isFeatured: false,
    isNewArrival: true,
    variants: variants("demo-jorts", [1, 3, 3, 2]),
  },
  {
    id: "demo-cargo-jorts",
    name: "Cargo Jorts",
    slug: "cargo-jorts",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Jorts", slug: "jorts" },
    priceKobo: 1750000,
    compareAtPriceKobo: 2000000,
    isFeatured: true,
    isNewArrival: false,
    variants: variants("demo-cargo", [2, 2, 1, 0]),
  },
  {
    id: "demo-cable-knit-sweater",
    name: "Cable Knit Sweater",
    slug: "cable-knit-sweater",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Sweaters", slug: "sweaters" },
    priceKobo: 2800000,
    compareAtPriceKobo: 3200000,
    isFeatured: true,
    isNewArrival: false,
    variants: variants("demo-cable", [2, 2, 2, 1]),
  },
  {
    id: "demo-ribbed-knit-sweater",
    name: "Ribbed Knit Sweater",
    slug: "ribbed-knit-sweater",
    description:
      "A Creamice staple. Full fabric, fit and care details are published from the dashboard.",
    category: { name: "Sweaters", slug: "sweaters" },
    priceKobo: 2600000,
    compareAtPriceKobo: null,
    isFeatured: false,
    isNewArrival: true,
    variants: variants("demo-ribbed", [3, 0, 2, 1]),
  },
];

export const fallbackCategories = [
  { name: "Hoodies", slug: "hoodies" },
  { name: "Sweatshirts", slug: "sweatshirts" },
  { name: "Joggers", slug: "joggers" },
  { name: "Sweatpants", slug: "sweatpants" },
  { name: "Jorts", slug: "jorts" },
  { name: "Sweaters", slug: "sweaters" },
];
