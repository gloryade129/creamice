"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import {
  addAddressAction,
  type AccountActionState,
} from "@/app/(store)/account/actions";

const initialState: AccountActionState = {};

export function AddressForm() {
  const [state, action, pending] = useActionState(addAddressAction, initialState);

  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      <Input label="Label (optional)" name="label" placeholder="Home, office" maxLength={40} />
      <Input
        label="Recipient name"
        name="recipientName"
        autoComplete="name"
        required
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
      />
      <Input
        label="City"
        name="city"
        autoComplete="address-level2"
        required
      />
      <div className="sm:col-span-2">
        <Input
          label="Address"
          name="address"
          autoComplete="street-address"
          placeholder="Street, building, landmark"
          required
        />
      </div>
      <Select label="State" name="state" required defaultValue="">
        <option value="">Select a state</option>
        {NIGERIAN_STATES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </Select>

      <label className="flex min-h-[44px] items-center gap-2 text-sm text-offwhite sm:col-span-2">
        <input
          type="checkbox"
          name="makeDefault"
          className="h-4 w-4 rounded border-border-strong accent-[#c6a15b]"
        />
        Make this my default address
      </label>

      {state.error ? (
        <p role="alert" className="sm:col-span-2 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="sm:col-span-2 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          {state.success}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border-strong bg-surface px-6 text-sm font-semibold text-offwhite transition-colors hover:border-offwhite disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save address"}
        </button>
      </div>
    </form>
  );
}
