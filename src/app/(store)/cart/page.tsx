import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CartView } from "@/components/store/CartView";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review the items in your Creamice bag.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="container-page py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="transition-colors hover:text-offwhite">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-offwhite">Bag</span>
      </nav>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-oswald text-[30px] font-semibold uppercase tracking-[0.02em] text-offwhite md:text-[38px]">
          Your bag
        </h1>
        <Link href="/shop" className="text-sm text-muted transition-colors hover:text-offwhite">
          Keep shopping
        </Link>
      </div>

      <CartView />
    </div>
  );
}
