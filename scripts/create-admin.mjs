// One-off setup: creates the first admin auth user and its profiles row when
// the project has none. Run with:
//   node --env-file=.env.local scripts/create-admin.mjs
// Prints the temporary password once. Change it after the first sign-in.
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = "admin@creamice.com";
const { data: existingUsers } = await supabase.auth.admin.listUsers();
const existing = existingUsers?.users.find((user) => user.email === email);

let userId = existing?.id;

if (!existing) {
  const password = `Cm-${randomBytes(9).toString("base64url")}`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Admin" },
  });

  if (error || !data.user) {
    console.error("Could not create the admin user:", error?.message);
    process.exit(1);
  }

  userId = data.user.id;
  console.log(`Created ${email}`);
  console.log(`Temporary password: ${password}`);
} else {
  console.log(`${email} already exists (${existing.id})`);
}

const { data: profile } = await supabase
  .from("profiles")
  .select("id, role")
  .eq("id", userId)
  .maybeSingle();

if (profile) {
  console.log(`Profile exists with role ${profile.role}.`);
  process.exit(0);
}

const { error: insertError } = await supabase.from("profiles").insert({
  id: userId,
  full_name: "Admin",
  role: "admin",
});

if (insertError) {
  console.error("Could not create the admin profile:", insertError.message);
  process.exit(1);
}

console.log("Admin profile created.");
