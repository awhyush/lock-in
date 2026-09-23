import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { generateResetToken, hashResetToken, RESET_TOKEN_TTL_MS } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

const IP_LIMIT = 8;
const EMAIL_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;

// Always the same response whether or not the email exists — otherwise this endpoint
// becomes a way to check who has an account here. A function, not a shared instance,
// since a Response body can only be read once.
function genericResponse() {
  return NextResponse.json({ message: "If an account exists for that email, we've sent a reset link." });
}

// Disabled for now: Resend's free tier without a verified sending domain can only deliver
// to the account owner's own email, not real users. Flip to false to re-enable once a
// domain is verified — the handler below it is fully intact and already tested.
const DISABLED = true;

export async function POST(req: Request) {
  if (DISABLED) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const ip = getClientIp(req);
  const { limited: ipLimited } = await checkRateLimit(`forgot-password:ip:${ip}`, {
    limit: IP_LIMIT,
    windowMs: WINDOW_MS,
  });
  if (ipLimited) {
    return NextResponse.json({ error: "Too many attempts. Try again in a bit." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Rate-limit per target email too, so one victim's inbox can't be spammed from many IPs.
  const { limited: emailLimited } = await checkRateLimit(`forgot-password:email:${email}`, {
    limit: EMAIL_LIMIT,
    windowMs: WINDOW_MS,
  });
  if (emailLimited) {
    return genericResponse();
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return genericResponse();
  }

  // A fresh request invalidates any still-outstanding link from an earlier request.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

  const rawToken = generateResetToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${SITE_URL}/reset-password?token=${rawToken}`;
  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    // A delivery failure must not change this response — otherwise the response itself
    // (200 vs 500) becomes a way to tell which emails have accounts.
    console.error("[forgot-password] email send failed:", err);
  }

  return genericResponse();
}
