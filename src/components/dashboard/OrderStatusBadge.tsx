import { Badge } from "@/components/ui";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";

const VARIANTS: Record<
  OrderStatus,
  "default" | "gold" | "success" | "error" | "muted"
> = {
  pending_payment: "muted",
  paid: "gold",
  confirmed: "gold",
  processing: "default",
  shipped: "default",
  delivered: "success",
  cancelled: "error",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANTS[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
