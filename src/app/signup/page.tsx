import type { Metadata } from "next";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your account for The Lock-In and set up a plan you'll actually stick to.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  return <SignupForm googleEnabled={googleEnabled} />;
}
