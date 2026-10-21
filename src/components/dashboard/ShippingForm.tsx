"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { koboToNairaInput } from "@/lib/money";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import type { AdminShippingRate } from "@/lib/data/shipping";
import {
  updateShippingAction,
  type ShippingActionState,
} from "@/app/(dashboard)/dashboard/shipping/actions";

const initialState: ShippingActionState = {};

function initialFees(rates: AdminShippingRate[]): Record<string, string> {
  const saved = new Map(rates.map((rate) => [rate.state, rate.feeKobo]));
  return Object.fromEntries(
    NIGERIAN_STATES.map((state) => [
      state,
      koboToNairaInput(saved.get(state) ?? 0),
    ])
  );
}

export function ShippingForm({
  rates,
  defaultFeeKobo,
}: {
  rates: AdminShippingRate[];
  defaultFeeKobo: number;
}) {
  const [state, action, pending] = useActionState(updateShippingAction, initialState);
  const [defaultFee, setDefaultFee] = useState(koboToNairaInput(defaultFeeKobo));
  const [fees, setFees] = useState(() => initialFees(rates));

  function useDefaultForAll() {
    setFees(
      Object.fromEntries(NIGERIAN_STATES.map((state) => [state, defaultFee]))
    );
  }

  return (
    <form action={action} className="space-y-6">
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          role="status"
          className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
        >
          {state.success}
        </p>
      ) : null}

      <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
        <h2 className="font-montserrat text-sm font-semibold text-offwhite">
          Default delivery fee
        </h2>
        <p className="mt-1 max-w-[70ch] text-sm text-muted">
          Used when a state has no saved rate. Every state below already has its
          own field, so this is the fallback, not the normal price.
        </p>
        <div className="mt-5 max-w-xs">
          <Input
            label="Default fee (naira)"
            name="default_fee"
            inputMode="decimal"
            value={defaultFee}
            onChange={(event) => setDefaultFee(event.target.value)}
            hint="For example 3500 or 3500.50."
            required
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-montserrat text-sm font-semibold text-offwhite">
              Fee by state
            </h2>
            <p className="mt-1 max-w-[70ch] text-sm text-muted">
              All 36 states and the FCT. Saving this form applies the fees shown
              below to new checkout quotes.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={useDefaultForAll}>
            Use default for all
          </Button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {NIGERIAN_STATES.map((stateName, index) => (
            <Input
              key={stateName}
              label={stateName}
              name={`fee_${index}`}
              inputMode="decimal"
              value={fees[stateName] ?? ""}
              onChange={(event) =>
                setFees((current) => ({
                  ...current,
                  [stateName]: event.target.value,
                }))
              }
              required
            />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          Save delivery fees
        </Button>
        <p className="text-xs text-muted">
          Amounts are in naira. Existing orders keep the fee they were charged.
        </p>
      </div>
    </form>
  );
}
