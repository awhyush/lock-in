import { Resend } from "resend";
import { SITE_NAME } from "@/lib/site";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || "The Lock-In <onboarding@resend.dev>";

/** Sends the password-reset link. Falls back to logging the link server-side when
 * RESEND_API_KEY isn't configured, so the flow is fully testable before a real
 * provider is wired up — no code changes needed once the key is added. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set — password reset link for ${to}: ${resetUrl}`);
    return;
  }

  // The SDK returns { data, error } rather than throwing on API-level failures
  // (bad recipient, unverified domain, etc.) — surface those as a thrown error too,
  // so callers can handle "did the email actually send" with one code path.
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Reset your ${SITE_NAME} password`,
    text: `Someone requested a password reset for your ${SITE_NAME} account.\n\nReset it here: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can safely ignore this email.`,
    html: `<p>Someone requested a password reset for your ${SITE_NAME} account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>`,
  });
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
