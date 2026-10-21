import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getCommissionReport, type CommissionReport } from "@/lib/data/reports";
import {
  buildCommissionCsv,
  parseMonthValue,
} from "@/lib/reports";

export async function GET(request: NextRequest) {
  await requireRole(["admin"]);

  const month = parseMonthValue(
    request.nextUrl.searchParams.get("month") ?? undefined
  );
  let report: CommissionReport;
  try {
    report = await getCommissionReport(month);
  } catch {
    return NextResponse.json(
      { error: "Could not build the commission report." },
      { status: 500 }
    );
  }
  const csv = buildCommissionCsv(
    report.month,
    report.rows.map((row) => ({
      orderNumber: row.orderNumber,
      paidAt: row.paidAt,
      orderStatus: row.orderStatus,
      customerName: row.customerName,
      productValueKobo: row.productValueKobo,
      deliveryKobo: row.deliveryKobo,
      totalKobo: row.totalKobo,
      commissionRate: row.commissionRate,
      commissionKobo: row.commissionKobo,
      builderSubaccountId: row.builderSubaccountId,
      txRef: row.txRef,
    }))
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="creamice-commission-${month.value}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
