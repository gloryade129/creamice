import Link from "next/link";
import { Check } from "lucide-react";

// Shared frame for sign in and create account. The dark panel is the only
// dark block on these pages and uses the dashboard theme tokens.
export function AccountAuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="container-page py-10 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[420px_1fr] lg:items-stretch">
        <div className="order-2 rounded-xl border border-border bg-surface p-5 md:p-8 lg:order-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-ink">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-oswald text-[30px] font-semibold uppercase leading-tight tracking-[0.02em] text-offwhite md:text-[36px]">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>

          <div className="mt-6">{children}</div>
          <div className="mt-6 border-t border-border pt-5 text-sm text-muted">{footer}</div>
        </div>

        <aside className="theme-admin order-1 flex flex-col justify-between rounded-xl border border-border bg-jet p-6 md:p-10 lg:order-2">
          <div>
            <Link
              href="/"
              className="inline-block font-oswald text-2xl font-semibold uppercase leading-none tracking-[0.12em] text-offwhite"
            >
              Creamice<span className="text-gold">.</span>
            </Link>
            <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              Your account
            </p>
            <h2 className="mt-3 max-w-[22ch] font-oswald text-[30px] font-semibold uppercase leading-[1.1] tracking-[0.02em] text-offwhite md:text-[40px]">
              Keep every order in one place.
            </h2>
          </div>

          <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm text-muted">
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              See your order status without looking for a link.
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              Save delivery addresses for your next order.
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              Checkout as a guest any time; an account is optional.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
