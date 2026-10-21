import { NextResponse } from "next/server";
import { quoteSchema, fieldErrors } from "@/lib/validation/checkout";
import { quoteCart, CheckoutError } from "@/lib/data/checkout";

// Public, read-only re-pricing for the checkout summary. The browser shows
// these numbers, and /api/checkout repeats the same work before charging.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid request." }, { status: 400 });
  }

  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check your bag and try again.", fieldErrors: fieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const quote = await quoteCart(parsed.data);
    return NextResponse.json({ quote });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Could not check your bag. Try again." },
      { status: 503 }
    );
  }
}
