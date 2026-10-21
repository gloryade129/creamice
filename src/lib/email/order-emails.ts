import { getOrderEmailData, type OrderEmailData } from "@/lib/data/checkout";
import { getStoreSettings } from "@/lib/data/settings";
import { createOrderToken } from "@/lib/order-token";
import { formatNaira } from "@/lib/money";
import { isEmailConfigured, sendEmail } from "@/lib/email/brevo";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function siteBase(origin: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = configured && /^https?:\/\//.test(configured) ? configured : origin;
  return base.replace(/\/+$/, "");
}

function itemLines(order: OrderEmailData): string[] {
  return order.items.map((item) => {
    const variant = [item.size, item.color].filter(Boolean).join(" / ");
    return `${item.productName}${variant ? ` (${variant})` : ""} × ${item.quantity} — ${formatNaira(
      item.unitPriceKobo * item.quantity
    )}`;
  });
}

function totalsLines(order: OrderEmailData): string[] {
  const lines = [`Subtotal: ${formatNaira(order.subtotalKobo)}`];
  if (order.discountKobo > 0) lines.push(`Discount: -${formatNaira(order.discountKobo)}`);
  lines.push(`Delivery: ${formatNaira(order.shippingKobo)}`);
  lines.push(`Total paid: ${formatNaira(order.totalKobo)}`);
  return lines;
}

function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f3ec;font-family:Arial,Helvetica,sans-serif;color:#121212;">
    <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
      <div style="background:#0b0b0b;padding:20px 24px;">
        <p style="margin:0;color:#ffffff;font-size:22px;letter-spacing:3px;font-weight:bold;">CREAMICE<span style="color:#c6a15b;">.</span></p>
      </div>
      <div style="background:#ffffff;border:1px solid #e7e2d7;border-top:none;padding:28px 24px;">
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#121212;">${escapeHtml(title)}</h1>
        ${bodyHtml}
      </div>
      <p style="margin:16px 4px 0;color:#6a6a6a;font-size:12px;line-height:1.6;">
        Creamice · Nigerian streetwear
      </p>
    </div>
  </body>
</html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;">${escapeHtml(text)}</p>`;
}

function list(items: string[]): string {
  return `<ul style="margin:0 0 18px;padding-left:18px;font-size:15px;line-height:1.7;">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:22px 0 8px;"><a href="${escapeHtml(
    href
  )}" style="display:inline-block;background:#c6a15b;color:#14100a;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:8px;">${escapeHtml(
    label
  )}</a></p>`;
}

function addressLines(order: OrderEmailData): string[] {
  return [
    order.customerName,
    order.shippingAddress,
    `${order.shippingCity}, ${order.shippingState}`,
    order.customerPhone,
    ...(order.deliveryNote ? [`Note: ${order.deliveryNote}`] : []),
  ];
}

// Called after mark_order_paid. The caller catches failures: email must never
// undo a verified payment.
export async function sendOrderPaidEmails(orderId: string, origin: string): Promise<void> {
  if (!isEmailConfigured()) return;

  const [order, settings] = await Promise.all([getOrderEmailData(orderId), getStoreSettings()]);
  if (!order) {
    console.error("[email] Paid order could not be loaded for email.");
    return;
  }

  const base = siteBase(origin);
  const orderUrl = `${base}/order/${encodeURIComponent(order.orderNumber)}?token=${createOrderToken(
    order.orderNumber
  )}`;
  const items = itemLines(order);
  const totals = totalsLines(order);
  const address = addressLines(order);
  const supportEmail = process.env.SELLER_EMAIL?.trim() || settings.support_email;

  const customerHtml = emailShell(
    `Payment received for ${order.orderNumber}`,
    [
      paragraph(
        `Hello ${order.customerName}, we have received your payment of ${formatNaira(
          order.totalKobo
        )}. Your order is now with our team.`
      ),
      list(items),
      list(totals),
      paragraph("Delivering to:"),
      list(address),
      button(orderUrl, "View your order"),
      paragraph("Keep this link to check your order status. You can also use your order number and email on the track page."),
    ].join("")
  );

  const customerText = [
    `Creamice — payment received for ${order.orderNumber}`,
    "",
    `Hello ${order.customerName}, we have received your payment of ${formatNaira(order.totalKobo)}.`,
    "",
    "Items:",
    ...items.map((line) => `- ${line}`),
    "",
    ...totals,
    "",
    "Delivering to:",
    ...address.map((line) => `- ${line}`),
    "",
    `View your order: ${orderUrl}`,
  ].join("\n");

  const sellerHtml = emailShell(
    `New paid order ${order.orderNumber}`,
    [
      paragraph(
        `${order.customerName} paid ${formatNaira(order.totalKobo)}. Contact: ${
          order.customerEmail
        } · ${order.customerPhone}`
      ),
      list(items),
      list(totals),
      paragraph("Deliver to:"),
      list(address),
      button(`${base}/dashboard`, "Open the dashboard"),
    ].join("")
  );

  const sellerText = [
    `New paid order ${order.orderNumber} — ${formatNaira(order.totalKobo)}`,
    "",
    `Customer: ${order.customerName}`,
    `Email: ${order.customerEmail}`,
    `Phone: ${order.customerPhone}`,
    "",
    "Items:",
    ...items.map((line) => `- ${line}`),
    "",
    ...totals,
    "",
    "Deliver to:",
    ...address.map((line) => `- ${line}`),
    "",
    `Dashboard: ${base}/dashboard`,
  ].join("\n");

  const customerSent = await sendEmail({
    to: [{ email: order.customerEmail, name: order.customerName }],
    subject: `Payment received — ${order.orderNumber}`,
    html: customerHtml,
    text: customerText,
    ...(settings.support_email
      ? { replyTo: { email: settings.support_email, name: settings.store_name } }
      : {}),
  });

  const sellerSent = supportEmail
    ? await sendEmail({
        to: [{ email: supportEmail, name: settings.store_name }],
        subject: `New paid order ${order.orderNumber} — ${formatNaira(order.totalKobo)}`,
        html: sellerHtml,
        text: sellerText,
        ...(settings.support_email
          ? { replyTo: { email: order.customerEmail, name: order.customerName } }
          : {}),
      })
    : false;

  if (!customerSent || !sellerSent) {
    console.warn(
      `[email] Order ${order.orderNumber}: customer ${customerSent ? "sent" : "not sent"}, seller ${
        sellerSent ? "sent" : "not sent"
      }.`
    );
  }
}
