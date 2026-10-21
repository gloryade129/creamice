"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/browser";

export function AccountRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters for the password.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });

    if (signUpError) {
      const message = signUpError.message.toLowerCase();
      setError(
        message.includes("already registered") || message.includes("already exists")
          ? "An account already exists for that email. Sign in instead."
          : "Could not create the account. Check the details and try again."
      );
      setPending(false);
      return;
    }

    if (data.session) {
      router.replace("/account");
      router.refresh();
      return;
    }

    setSentTo(email.trim());
    setPending(false);
  }

  if (sentTo) {
    return (
      <div className="rounded-lg border border-gold/40 bg-gold/10 p-4">
        <MailCheck className="h-5 w-5 text-gold-ink" aria-hidden="true" />
        <p className="mt-2 font-semibold text-offwhite">Confirm your email</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          We sent a confirmation link to <span className="text-offwhite">{sentTo}</span>.
          Open it, then sign in. Check your spam folder if it has not arrived.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full name"
        name="full_name"
        autoComplete="name"
        placeholder="Your full name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Input
        label="Phone (optional)"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0801 234 5678"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <Input
        label="Confirm password"
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        required
      />

      {error ? (
        <p role="alert" className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#121212] px-6 text-sm font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-xs leading-relaxed text-muted">
        Your email is used for order receipts and account access. We do not
        publish it.
      </p>
    </form>
  );
}
