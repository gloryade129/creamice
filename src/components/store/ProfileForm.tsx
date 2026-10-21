"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import {
  updateProfileAction,
  type AccountActionState,
} from "@/app/(store)/account/actions";

const initialState: AccountActionState = {};

export function ProfileForm({
  fullName,
  phone,
}: {
  fullName: string;
  phone: string | null;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      <Input
        label="Full name"
        name="fullName"
        autoComplete="name"
        defaultValue={fullName}
        required
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={phone ?? ""}
        placeholder="0801 234 5678"
      />

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
          className="inline-flex h-11 items-center justify-center rounded-lg bg-[#121212] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save details"}
        </button>
      </div>
    </form>
  );
}
