"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import {
  addAddress,
  deleteAddress,
  getCustomerSession,
  setDefaultAddress,
  updateCustomer,
  type CustomerSession,
} from "@/lib/data/customers";
import {
  addressSchema,
  firstError,
  profileSchema,
} from "@/lib/validation/account";

export interface AccountActionState {
  error?: string;
  success?: string;
}

// Every action starts here: the session, not a hidden customer id, decides
// whose data is changed.
async function signedIn(): Promise<CustomerSession | null> {
  const session = await getCustomerSession();
  if (!session?.customer) return null;
  return session;
}

export async function updateProfileAction(
  _previous: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await signedIn();
  if (!session) return { error: "Sign in again to change your details." };

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const saved = await updateCustomer(session.customer!.id, {
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
  });
  if (!saved) return { error: "Could not save your details. Try again." };

  revalidatePath("/account");
  return { success: "Your details are saved." };
}

export async function addAddressAction(
  _previous: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await signedIn();
  if (!session) return { error: "Sign in again to add an address." };

  const parsed = addressSchema.safeParse({
    label: formData.get("label"),
    recipientName: formData.get("recipientName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const result = await addAddress(
    session.customer!.id,
    parsed.data,
    formData.get("makeDefault") === "on"
  );
  if (!result.ok) return { error: result.error ?? "Could not save that address." };

  revalidatePath("/account");
  return { success: "Address saved." };
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const session = await signedIn();
  if (!session) redirect("/account/login");

  const addressId = formData.get("addressId");
  if (typeof addressId !== "string" || !addressId) return;

  await deleteAddress(session.customer!.id, addressId);
  revalidatePath("/account");
}

export async function setDefaultAddressAction(formData: FormData): Promise<void> {
  const session = await signedIn();
  if (!session) redirect("/account/login");

  const addressId = formData.get("addressId");
  if (typeof addressId !== "string" || !addressId) return;

  await setDefaultAddress(session.customer!.id, addressId);
  revalidatePath("/account");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
