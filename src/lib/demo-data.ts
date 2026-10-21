// Demo content for UI review only. It is replaced by database rows as soon
// as the shop data layer lands (T13/T14); nothing here is a real price, photo
// or announcement. Keep it in one file so deleting it is a one-line change.

export interface DemoProduct {
  id: string;
  name: string;
  slug: string;
  priceKobo: number;
  compareAtPriceKobo: number | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  soldOut: boolean;
}

export const demoProducts: DemoProduct[] = [
  {
    id: "demo-1",
    name: "Heavyweight Hoodie",
    slug: "heavyweight-hoodie",
    priceKobo: 2500000,
    compareAtPriceKobo: 3000000,
    isFeatured: true,
    isNewArrival: true,
    soldOut: false,
  },
  {
    id: "demo-2",
    name: "Oversized Sweatshirt",
    slug: "oversized-sweatshirt",
    priceKobo: 2200000,
    compareAtPriceKobo: null,
    isFeatured: true,
    isNewArrival: true,
    soldOut: false,
  },
  {
    id: "demo-3",
    name: "Tapered Joggers",
    slug: "tapered-joggers",
    priceKobo: 1800000,
    compareAtPriceKobo: 2200000,
    isFeatured: false,
    isNewArrival: true,
    soldOut: false,
  },
  {
    id: "demo-4",
    name: "Heavy Sweatpants",
    slug: "heavy-sweatpants",
    priceKobo: 2000000,
    compareAtPriceKobo: null,
    isFeatured: true,
    isNewArrival: false,
    soldOut: true,
  },
  {
    id: "demo-5",
    name: "Denim Jorts",
    slug: "denim-jorts",
    priceKobo: 1600000,
    compareAtPriceKobo: null,
    isFeatured: false,
    isNewArrival: true,
    soldOut: false,
  },
  {
    id: "demo-6",
    name: "Cable Knit Sweater",
    slug: "cable-knit-sweater",
    priceKobo: 2800000,
    compareAtPriceKobo: 3200000,
    isFeatured: true,
    isNewArrival: false,
    soldOut: false,
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
