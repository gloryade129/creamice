"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="theme-admin grid min-h-screen bg-jet text-offwhite lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-[#0B0B0B] p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="font-oswald text-2xl font-semibold uppercase leading-none tracking-[0.14em] text-offwhite">
            Creamice<span className="text-gold">.</span>
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
            Store operations
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[360px]">
          <div className="relative aspect-square">
            <Image
              src="/brand/logo-black-bg.jpeg"
              alt="Creamice"
              fill
              sizes="360px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div>
          <h1 className="max-w-[20ch] font-oswald text-3xl font-semibold uppercase leading-tight tracking-[0.02em] text-offwhite">
            Run the store from one place.
          </h1>
          <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-muted">
            Products, partner submissions, orders and delivery — all behind one
            sign-in.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <p className="font-oswald text-xl font-semibold uppercase leading-none tracking-[0.12em] text-offwhite">
              Creamice<span className="text-gold">.</span>
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted">
              Store operations
            </p>
          </div>

          <h2 className="font-oswald text-[28px] font-semibold uppercase tracking-[0.02em] text-offwhite">
            Sign in
          </h2>
          <p className="mt-1 text-sm text-muted">
            Staff access only. Use the account an admin created for you.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {error && (
              <div
                className="rounded-lg border border-error/40 bg-error/10 p-3 text-sm text-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@creamice.com"
              autoComplete="email"
              required
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={loading}
            />

            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted">
            No account? Ask an admin to create one for you.
          </p>
        </div>
      </section>
    </main>
  );
}
