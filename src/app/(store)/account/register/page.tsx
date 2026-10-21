import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountAuthShell } from "@/components/store/AccountAuthShell";
import { AccountRegisterForm } from "@/components/store/AccountRegisterForm";
import { getAuthUser } from "@/lib/data/customers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Creamice account for order history and saved addresses.",
  robots: { index: false, follow: false },
};

function safeNext(value: string | string[] | undefined): string {
  if (typeof value !== "string") return "/account";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/account";
  }
  return value;
}

export default async function AccountRegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();
  const params = await searchParams;
  const next = safeNext(params.next);

  if (user) redirect(next);

  return (
    <AccountAuthShell
      eyebrow="New account"
      title="Create account"
      subtitle="An account keeps your order history and delivery addresses together. Guest checkout stays available."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href={`/account/login?next=${encodeURIComponent(next)}`}
            className="font-semibold text-gold-ink underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
          .
        </p>
      }
    >
      <AccountRegisterForm />
    </AccountAuthShell>
  );
}
