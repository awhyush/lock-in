import { BRUTALIST_FONT_VARS } from "@/lib/brutalist-fonts";
import { NoiseOverlay } from "@/components/NoiseOverlay";

// Shared primitives for LoginForm/SignupForm/ForgotPasswordForm/ResetPasswordForm — co-located
// here since AuthCard is the one thing all four already share, rather than repeating these
// strings four times and risking drift.
export const authInputClass =
  "w-full border-b-[0.5px] border-white/15 bg-transparent py-3 font-[family-name:var(--font-inter)] text-sm font-light text-white outline-none transition-colors focus:border-white";
export const authLabelClass =
  "flex flex-col gap-2 font-[family-name:var(--font-jetbrains-mono)] text-[9px] font-medium uppercase tracking-[0.3em] text-white/50";
export const authButtonClass =
  "mt-2 rounded-full bg-white px-4 py-3.5 text-center font-[family-name:var(--font-jetbrains-mono)] text-[11px] font-medium uppercase tracking-[0.3em] text-black transition-colors duration-300 hover:bg-[#6366f1] hover:text-white disabled:opacity-40";
export const authLinkClass = "text-white underline underline-offset-4 transition-colors duration-300 hover:text-[#6366f1]";

export function AuthCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className={`${BRUTALIST_FONT_VARS} relative flex min-h-screen items-center justify-center bg-black px-4 py-12`}
    >
      <NoiseOverlay />
      <div className="relative w-full max-w-sm">
        <div className="mb-8">
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] font-medium uppercase tracking-[0.3em] text-white/50">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-inter-tight)] text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white">
            {title}
          </h1>
        </div>
        <div className="border-[0.5px] border-white/15 p-6">{children}</div>
      </div>
    </main>
  );
}
