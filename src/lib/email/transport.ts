import "server-only";
import nodemailer from "nodemailer";

// Email sending, provider chosen by environment variables:
//   RESEND_API_KEY            -> Resend (the plan's choice)
//   SMTP_HOST (+ user/pass)   -> any SMTP server, e.g. Gmail with an App Password
//   neither, outside prod     -> dry run: messages are logged, not sent
// EMAIL_DRY_RUN=1 forces a dry run anywhere.

export type EmailProvider = "resend" | "smtp" | "dry_run";

export type OutgoingEmail = { to: string; subject: string; html: string; text: string };
export type SendResult = { ok: true; id: string | null } | { ok: false; error: string };

export function emailProvider(): EmailProvider | null {
  if (process.env.EMAIL_DRY_RUN === "1") return "dry_run";
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_HOST) return "smtp";
  return process.env.NODE_ENV === "production" ? null : "dry_run";
}

function fromAddress() {
  const from = process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER?.trim();
  if (!from) throw new Error("Missing environment variable EMAIL_FROM. See .env.example.");
  return from;
}

function replyTo() {
  return process.env.EMAIL_REPLY_TO?.trim() || undefined;
}

export async function sendEmails(messages: OutgoingEmail[]): Promise<{ provider: EmailProvider; results: SendResult[] }> {
  const provider = emailProvider();
  if (!provider) throw new Error("email_not_configured");
  if (messages.length === 0) return { provider, results: [] };

  switch (provider) {
    case "resend":
      return { provider, results: await sendWithResend(messages) };
    case "smtp":
      return { provider, results: await sendWithSmtp(messages) };
    case "dry_run":
      for (const m of messages) console.info(`[email dry run] to=${m.to} subject=${JSON.stringify(m.subject)}`);
      return { provider, results: messages.map(() => ({ ok: true, id: null })) };
  }
}

// Resend's batch endpoint takes up to 100 emails per call, which also keeps
// well under its per-second rate limit.
async function sendWithResend(messages: OutgoingEmail[]): Promise<SendResult[]> {
  const base = (process.env.RESEND_API_URL ?? "https://api.resend.com").replace(/\/+$/, "");
  const from = fromAddress();
  const results: SendResult[] = [];

  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch(`${base}/emails/batch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(chunk.map((m) => ({ from, to: [m.to], reply_to: replyTo(), subject: m.subject, html: m.html, text: m.text }))),
        signal: AbortSignal.timeout(20000),
      });
      const body = (await res.json().catch(() => null)) as { data?: Array<{ id: string }>; message?: string } | null;
      if (!res.ok || !body?.data) {
        const error = body?.message ?? `HTTP ${res.status}`;
        results.push(...chunk.map(() => ({ ok: false as const, error })));
      } else {
        results.push(...chunk.map((_, j) => ({ ok: true as const, id: body.data?.[j]?.id ?? null })));
      }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      results.push(...chunk.map(() => ({ ok: false as const, error })));
    }
  }
  return results;
}

async function sendWithSmtp(messages: OutgoingEmail[]): Promise<SendResult[]> {
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD?.replace(/\s+/g, "") } : undefined,
    pool: true,
    maxConnections: 2,
  });
  const from = fromAddress();

  const results: SendResult[] = [];
  try {
    for (const m of messages) {
      try {
        const info = await transport.sendMail({ from, to: m.to, replyTo: replyTo(), subject: m.subject, html: m.html, text: m.text });
        results.push({ ok: true, id: info.messageId ?? null });
      } catch (e) {
        results.push({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    }
  } finally {
    transport.close();
  }
  return results;
}
