import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: {},
      password: {},
    },
    authorize: async (credentials) => {
      const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : undefined;
      const password = typeof credentials?.password === "string" ? credentials.password : undefined;
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      // No passwordHash means this account was created via Google and never set one —
      // credentials sign-in isn't possible for it yet.
      if (!user || !user.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, name: user.name, email: user.email };
    },
  }),
];

// Only registered when real credentials are configured, so a missing/unset env var never
// breaks the rest of auth — same graceful-degradation pattern as the Resend email setup.
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    // No database adapter is used (session/plan data is always re-fetched fresh from Prisma
    // server-side elsewhere in this app) — so Google sign-ins are linked to a User row by
    // hand here rather than through Auth.js's own Account-linking machinery. Matching by
    // email is safe because Google has already verified that email belongs to whoever is
    // signing in; an existing password-based account with the same email is reused, not
    // duplicated.
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        const email = user.email.toLowerCase();
        const dbUser =
          (await prisma.user.findUnique({ where: { email } })) ??
          (await prisma.user.create({
            data: { name: user.name || email.split("@")[0], email, passwordHash: null },
          }));
        token.id = dbUser.id;
        return token;
      }
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
