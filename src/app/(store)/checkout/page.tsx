import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { CheckoutView } from "@/components/store/CheckoutView";
import { getShippingConfig } from "@/lib/data/shipping";
import { getStoreSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Creamice order with secure online payment.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [shipping, settings] = await Promise.all([
    getShippingConfig(),
    getStoreSettings(),
  ]);

  // Only a boolean reaches the browser. The secret key stays on the server.
  const paymentEnabled = Boolean(process.env.FLW_SECRET_KEY);

  return (
    <div className="container-page py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-offwhite">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href="/cart" className="transition-colors hover:text-offwhite">
          Bag
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-offwhite">Checkout</span>
      </nav>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-oswald text-[30px] font-semibold uppercase tracking-[0.02em] text-offwhite md:text-[38px]">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-muted">
            One page. Online payment. Delivered anywhere in Nigeria.
          </p>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Secure checkout
        </p>
      </div>

      <CheckoutView
        shipping={shipping}
        paymentEnabled={paymentEnabled}
        whatsappNumber={settings.whatsapp_number}
      />
    </div>
  );
}
