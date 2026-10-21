import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountAuthShell } from "@/components/store/AccountAuthShell";
import { AccountLoginForm } from "@/components/store/AccountLoginForm";
import { getAuthUser } from "@/lib/data/customers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Creamice account to see your orders.",
};

function safeNext(value: string | string[] | undefined): string {
  if (typeof value !== "string") return "/account";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/account";
  }
  return value;
}

export default async function AccountLoginPage({
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
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="See your orders, save addresses and keep your delivery details ready."
      footer={
        <p>
          New to Creamice?{" "}
          <Link
            href={`/account/register?next=${encodeURIComponent(next)}`}
            className="font-semibold text-gold-ink underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
          . Or{" "}
          <Link href="/shop" className="font-semibold text-offwhite underline-offset-2 hover:underline">
            continue as a guest
          </Link>
          .
        </p>
      }
    >
      <AccountLoginForm next={next} />
    </AccountAuthShell>
  );
}
