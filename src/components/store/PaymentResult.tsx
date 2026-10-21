import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock3, MessageCircle } from "lucide-react";

type Tone = "success" | "pending" | "failed";

const icons = {
  success: CheckCircle2,
  pending: Clock3,
  failed: AlertCircle,
};

const tones: Record<Tone, { ring: string; icon: string }> = {
  success: { ring: "border-success/30 bg-success/5", icon: "text-success" },
  pending: { ring: "border-gold/40 bg-gold/10", icon: "text-gold-ink" },
  failed: { ring: "border-error/30 bg-error/5", icon: "text-error" },
};

export function PaymentResult({
  tone,
  title,
  message,
  primary,
  secondary,
  whatsappNumber,
  reference,
}: {
  tone: Tone;
  title: string;
  message: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  whatsappNumber?: string | null;
  reference?: string | null;
}) {
  const Icon = icons[tone];
  const palette = tones[tone];
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}${
        reference ? `?text=${encodeURIComponent(`Hello Creamice, I need help with order ${reference}.`)}` : ""
      }`
    : null;

  return (
    <div className="mx-auto max-w-xl">
      <div className={`rounded-xl border p-6 text-center md:p-8 ${palette.ring}`}>
        <Icon className={`mx-auto h-10 w-10 ${palette.icon}`} aria-hidden="true" />
        <h1 className="mt-4 font-oswald text-[26px] font-semibold uppercase tracking-[0.02em] text-offwhite md:text-[32px]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>
        {reference ? (
          <p className="mt-3 text-xs uppercase tracking-[0.12em] text-muted">
            Order {reference}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {primary ? (
            <Link
              href={primary.href}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#121212] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2a2a2a]"
            >
              {primary.label}
            </Link>
          ) : null}
          {secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border-strong bg-surface px-6 text-sm font-semibold text-offwhite transition-colors hover:border-offwhite"
            >
              {secondary.label}
            </Link>
          ) : null}
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-6 text-sm font-semibold text-offwhite transition-colors hover:border-offwhite"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp us
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
