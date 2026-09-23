import { redirect } from "next/navigation";

// Disabled for now: Resend's free tier without a verified sending domain can only deliver
// to the account owner's own email, not real users, so the flow isn't usable in production
// yet. The actual page (ForgotPasswordForm) and its API routes are untouched — once a
// domain is verified, swap this back to `return <ForgotPasswordForm />;` and re-add the
// "Forgot password?" link in LoginForm.tsx.
export default function ForgotPasswordPage() {
  redirect("/login");
}
