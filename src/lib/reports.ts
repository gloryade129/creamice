// Reporting helpers. Dates are grouped by West Africa Time (UTC+1, no DST),
// because that is the business day and month the owner sees.
export const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface MonthValue {
  year: number;
  month: number;
  value: string;
}

export function lagosMonthValue(now: Date = new Date()): string {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS);
  const year = lagos.getUTCFullYear();
  const month = String(lagos.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function parseMonthValue(value: string | undefined): MonthValue {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return { year, month, value };
  }

  const fallback = lagosMonthValue();
  const [year, month] = fallback.split("-").map(Number);
  return { year, month, value: fallback };
}

export function monthLabel(month: MonthValue): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(month.year, month.month - 1, 1)));
}

// Local midnight is 23:00 UTC on the previous day. The range is half-open:
// start inclusive, end exclusive.
export function lagosMonthRange(year: number, month: number): {
  startIso: string;
  endIso: string;
} {
  return {
    startIso: new Date(Date.UTC(year, month - 1, 1) - LAGOS_OFFSET_MS).toISOString(),
    endIso: new Date(Date.UTC(year, month, 1) - LAGOS_OFFSET_MS).toISOString(),
  };
}

export function lagosDayRange(now: Date = new Date()): {
  startIso: string;
  endIso: string;
} {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS);
  const start = Date.UTC(
    lagos.getUTCFullYear(),
    lagos.getUTCMonth(),
    lagos.getUTCDate()
  ) - LAGOS_OFFSET_MS;

  return {
    startIso: new Date(start).toISOString(),
    endIso: new Date(start + DAY_MS).toISOString(),
  };
}

// Exact kobo -> plain naira string for spreadsheets. No symbol and no
// thousands separators, so the column stays numeric.
export function koboToDecimal(kobo: number): string {
  const sign = kobo < 0 ? "-" : "";
  const absolute = Math.abs(kobo);
  return `${sign}${Math.trunc(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

export function commissionRatePercent(rate: number): string {
  return (Math.round(rate * 10000) / 100).toFixed(2);
}

export interface CommissionCsvRow {
  orderNumber: string;
  paidAt: string;
  orderStatus: string;
  customerName: string;
  productValueKobo: number;
  deliveryKobo: number;
  totalKobo: number;
  commissionRate: number;
  commissionKobo: number;
  builderSubaccountId: string | null;
  txRef: string;
}

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCommissionCsv(
  month: MonthValue,
  rows: CommissionCsvRow[]
): string {
  const header = [
    "Month",
    "Order number",
    "Paid at",
    "Order status",
    "Customer",
    "Product value (NGN)",
    "Delivery (NGN)",
    "Total paid (NGN)",
    "Commission rate (%)",
    "Commission (NGN)",
    "Builder subaccount",
    "Transaction reference",
  ];

  const lines = rows.map((row) =>
    [
      monthLabel(month),
      row.orderNumber,
      row.paidAt,
      row.orderStatus,
      row.customerName,
      koboToDecimal(row.productValueKobo),
      koboToDecimal(row.deliveryKobo),
      koboToDecimal(row.totalKobo),
      commissionRatePercent(row.commissionRate),
      koboToDecimal(row.commissionKobo),
      row.builderSubaccountId,
      row.txRef,
    ]
      .map(csvCell)
      .join(",")
  );

  return [header.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}
