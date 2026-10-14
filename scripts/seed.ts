import { createAdminClient } from "@/lib/supabase/admin";

const categories = [
  { name: "Hoodies", slug: "hoodies", sort_order: 1 },
  { name: "Sweatshirts", slug: "sweatshirts", sort_order: 2 },
  { name: "Joggers", slug: "joggers", sort_order: 3 },
  { name: "Sweatpants", slug: "sweatpants", sort_order: 4 },
  { name: "Jorts", slug: "jorts", sort_order: 5 },
  { name: "Sweaters", slug: "sweaters", sort_order: 6 },
];

const nigeriaStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT",
];

async function seed() {
  const supabase = createAdminClient();

  console.log("Seeding categories...");
  for (const cat of categories) {
    const { error } = await supabase
      .from("categories")
      .upsert(cat, { onConflict: "slug" });
    if (error) {
      console.error(`Failed to seed category ${cat.name}:`, error);
    } else {
      console.log(`  ✓ ${cat.name}`);
    }
  }

  console.log("\nSeeding shipping rates...");
  for (const state of nigeriaStates) {
    const { error } = await supabase
      .from("shipping_rates")
      .upsert({ state, fee_kobo: 0, is_active: true }, { onConflict: "state" });
    if (error) {
      console.error(`Failed to seed shipping rate for ${state}:`, error);
    } else {
      console.log(`  ✓ ${state}`);
    }
  }

  console.log("\nSeeding complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});