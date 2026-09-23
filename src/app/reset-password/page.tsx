import { redirect } from "next/navigation";

// Disabled alongside /forgot-password (see that file for why). The actual page
// (ResetPasswordForm) is untouched — restore `return <Suspense><ResetPasswordForm />
// </Suspense>;` once forgot-password is re-enabled.
export default function ResetPasswordPage() {
  redirect("/login");
}
