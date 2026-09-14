import "server-only";

type LeadNotification = { id: string; name: string; email?: string; phone?: string; type: string; sourcePage?: string };

/** Sends only after persistence. Configuration remains server-only and optional
 * for local development; no credential or provider response is logged. */
export async function notifyAdminOfLead(lead: LeadNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_SEED_EMAIL;
  if (!apiKey || !from || !to) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New ${lead.type.toLowerCase().replace("_", " ")} lead`,
      text: `Lead ID: ${lead.id}\nName: ${lead.name}\nEmail: ${lead.email ?? "Not provided"}\nPhone: ${lead.phone ?? "Not provided"}\nSource: ${lead.sourcePage ?? "Not provided"}`,
    }),
  });
  if (!response.ok) console.error(`[email] lead notification failed with status ${response.status}`);
}
