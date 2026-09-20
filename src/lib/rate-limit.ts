import { prisma } from "@/lib/prisma";

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Sliding-window rate limit backed by Postgres (works across Vercel's
 * serverless instances, unlike an in-memory counter). `key` scopes the
 * limit — e.g. `signup:<ip>` — so one table serves every rate-limited route.
 */
export async function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<{ limited: boolean }> {
  const windowStart = new Date(Date.now() - windowMs);

  // Opportunistic cleanup so the table doesn't grow unbounded; cheap enough
  // to skip most of the time.
  if (Math.random() < 0.05) {
    await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: windowStart } } }).catch(() => {});
  }

  const recent = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: windowStart } } });
  if (recent >= limit) return { limited: true };

  await prisma.rateLimitHit.create({ data: { key } });
  return { limited: false };
}
