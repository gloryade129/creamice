export interface EmailMessage {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  text: string;
  replyTo?: { email: string; name?: string };
}

function config() {
  return {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL,
    senderName: process.env.BREVO_SENDER_NAME || "Creamice",
  };
}

export function isEmailConfigured(): boolean {
  const { apiKey, senderEmail } = config();
  return Boolean(apiKey && senderEmail);
}

// Brevo transactional email. Failures are reported to the caller so payment
// completion is never rolled back by an email problem. Never log the API key
// or the message body.
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const { apiKey, senderEmail, senderName } = config();
  if (!apiKey || !senderEmail) {
    console.warn("[email] Brevo is not configured; skipping message.");
    return false;
  }

  let response: Response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: message.to,
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
        ...(message.replyTo ? { replyTo: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    console.error("[email] Brevo request failed.");
    return false;
  }

  if (!response.ok) {
    console.error(`[email] Brevo returned ${response.status}.`);
    return false;
  }
  return true;
}
