export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type UserRole = "admin" | "partner" | "board";

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

type RoleMap = Partial<Record<OrderStatus, UserRole[]>>;

const rolePermissions: Record<OrderStatus, RoleMap> = {
  pending_payment: {
    paid: ["admin"],
    cancelled: ["admin"],
  },
  paid: {
    confirmed: ["admin", "partner"],
    cancelled: ["admin"],
  },
  confirmed: {
    processing: ["admin", "partner"],
    cancelled: ["admin"],
  },
  processing: {
    shipped: ["admin", "partner"],
    cancelled: ["admin"],
  },
  shipped: {
    delivered: ["admin", "partner"],
  },
  delivered: {},
  cancelled: {},
};

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: UserRole,
  isSystem = false
): boolean {
  const allowed = statusTransitions[from]?.includes(to) ?? false;
  if (!allowed) return false;

  const roles = rolePermissions[from]?.[to] ?? [];
  if (isSystem && from === "pending_payment" && to === "cancelled") return true;
  return roles.includes(role);
}

export function getNextStatuses(from: OrderStatus): OrderStatus[] {
  return statusTransitions[from] ?? [];
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === "delivered" || status === "cancelled";
}

export function isPaidStatus(status: OrderStatus): boolean {
  return ["paid", "confirmed", "processing", "shipped", "delivered"].includes(status);
}