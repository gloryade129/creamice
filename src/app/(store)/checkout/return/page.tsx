import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PaymentResult } from "@/components/store/PaymentResult";
import { getPaymentByTxRef, markOrderPaid } from "@/lib/data/checkout";
import { getStoreSettings } from "@/lib/data/settings";
import { verifyPayment } from "@/lib/flutterwave";
import { createOrderToken } from "@/lib/order-token";
import { sendOrderPaidEmails } from "@/lib/email/order-emails";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment result",
  robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function orderHref(orderNumber: string, paid = false): string {
  const token = createOrderToken(orderNumber);
  return `/order/${encodeURIComponent(orderNumber)}?token=${token}${paid ? "&paid=1" : ""}`;
}

export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const txRef = one(params.tx_ref);
  const transactionId = one(params.transaction_id);
  const providerStatus = one(params.status);
  const settings = await getStoreSettings();

  if (!txRef) {
    return (
      <div className="container-page py-12 md:py-16">
        <PaymentResult
          tone="failed"
          title="No payment to confirm"
          message="This page opens after a Flutterwave payment. If you were sent here by mistake, your bag is still saved."
          primary={{ href: "/checkout", label: "Return to checkout" }}
          secondary={{ href: "/cart", label: "View bag" }}
          whatsappNumber={settings.whatsapp_number}
        />
      </div>
    );
  }

  const payment = await getPaymentByTxRef(txRef);
  if (!payment) {
    return (
      <div className="container-page py-12 md:py-16">
        <PaymentResult
          tone="failed"
          title="We could not find that order"
          message="The payment reference is not one of ours. If you were charged, contact us with the reference below and we will check it."
          primary={{ href: "/checkout", label: "Return to checkout" }}
          secondary={{ href: "/cart", label: "View bag" }}
          whatsappNumber={settings.whatsapp_number}
          reference={txRef}
        />
      </div>
    );
  }

  // A repeat visit, or the webhook already finished the order. The order page
  // needs no further verification because the database says it is paid.
  if (payment.paymentStatus === "successful" || payment.orderStatus !== "pending_payment") {
    redirect(orderHref(payment.orderNumber, providerStatus === "successful"));
  }

  if (providerStatus !== "successful" || !transactionId) {
    return (
      <div className="container-page py-12 md:py-16">
        <PaymentResult
          tone="failed"
          title="Payment not completed"
          message="Flutterwave did not confirm a successful payment, so this order is still awaiting payment. If your bank shows a charge, contact us and we will check it before you pay again."
          primary={{ href: "/checkout", label: "Try payment again" }}
          secondary={{ href: "/cart", label: "View bag" }}
          whatsappNumber={settings.whatsapp_number}
          reference={payment.orderNumber}
        />
      </div>
    );
  }

  let verification;
  try {
    verification = await verifyPayment(transactionId, txRef, payment.totalKobo);
  } catch {
    return (
      <div className="container-page py-12 md:py-16">
        <PaymentResult
          tone="pending"
          title="Still confirming your payment"
          message="We could not reach Flutterwave to confirm just now. If the payment succeeded, the order will update automatically when confirmation arrives. Check the order before paying again."
          primary={{ href: orderHref(payment.orderNumber), label: "Check this order" }}
          secondary={{ href: "/cart", label: "View bag" }}
          whatsappNumber={settings.whatsapp_number}
          reference={payment.orderNumber}
        />
      </div>
    );
  }

  if (!verification.ok || !verification.transactionId) {
    return (
      <div className="container-page py-12 md:py-16">
        <PaymentResult
          tone="failed"
          title="Payment not confirmed"
          message={`${verification.reason ?? "Flutterwave did not confirm this payment."} The order is still awaiting payment. If your bank shows a charge, contact us before trying again.`}
          primary={{ href: "/checkout", label: "Return to checkout" }}
          secondary={{ href: orderHref(payment.orderNumber), label: "Check this order" }}
          whatsappNumber={settings.whatsapp_number}
          reference={payment.orderNumber}
        />
      </div>
    );
  }

  let firstTime = false;
  try {
    firstTime = await markOrderPaid(txRef, verification.transactionId);
  } catch {
    return (
      <div className="container-page py-12 md:py-16">
        <PaymentResult
          tone="pending"
          title="Payment received"
          message="Flutterwave confirmed your payment, but we could not finish updating the order just now. It will update automatically. Please check the order before doing anything else, and contact us if it still shows awaiting payment."
          primary={{ href: orderHref(payment.orderNumber), label: "Check this order" }}
          whatsappNumber={settings.whatsapp_number}
          reference={payment.orderNumber}
        />
      </div>
    );
  }

  if (firstTime) {
    try {
      await sendOrderPaidEmails(payment.orderId, await getRequestOrigin());
    } catch {
      // The payment is confirmed; a failed receipt must not block the result.
      console.error(`[checkout] Emails failed for ${payment.orderNumber}.`);
    }
  }

  redirect(orderHref(payment.orderNumber, true));
}
