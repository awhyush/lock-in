import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { hashResetToken } from "@/lib/password-reset";

const IP_LIMIT = 15;
const WINDOW_MS = 60 * 60 * 1000;

// Disabled alongside /api/auth/forgot-password (see that file for why). Flip to false
// together with that one — a live token could never be requested while that route is off.
const DISABLED = true;

export async function POST(req: Request) {
  if (DISABLED) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const ip = getClientIp(req);
  const { limited } = await checkRateLimit(`reset-password:ip:${ip}`, { limit: IP_LIMIT, windowMs: WINDOW_MS });
  if (limited) {
    return NextResponse.json({ error: "Too many attempts. Try again in a bit." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "That reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    // Any other outstanding link for this user is now moot too.
    prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId, id: { not: resetToken.id }, usedAt: null },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
