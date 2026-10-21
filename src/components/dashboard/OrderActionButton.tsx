"use client";

import { Button } from "@/components/ui/Button";
import { updateOrderStatusAction } from "@/app/(dashboard)/dashboard/orders/actions";
import type { OrderStatus } from "@/lib/orders";

export function OrderActionButton({
  orderId,
  status,
  label,
  variant = "outline",
  confirmText,
}: {
  orderId: string;
  status: OrderStatus;
  label: string;
  variant?: "primary" | "outline" | "danger";
  confirmText?: string;
}) {
  return (
    <form
      action={updateOrderStatusAction}
      onSubmit={(event) => {
        if (confirmText && !window.confirm(confirmText)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant={variant}>
        {label}
      </Button>
    </form>
  );
}
