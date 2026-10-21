"use client";

import { useActionState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { trackOrder, type TrackState } from "@/app/(store)/track/actions";

const initialState: TrackState = {};

export function TrackForm({ defaultOrder = "" }: { defaultOrder?: string }) {
  const [state, action, pending] = useActionState(trackOrder, initialState);

  return (
    <form action={action} className="space-y-4">
      <Input
        label="Order number"
        name="orderNumber"
        defaultValue={defaultOrder}
        placeholder="CRM-1001"
        autoComplete="off"
        required
      />
      <Input
        label="Email used for the order"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
      />

      {state.error ? (
        <p role="alert" className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#121212] px-6 text-sm font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        {pending ? "Looking up…" : "Find my order"}
      </button>
    </form>
  );
}
