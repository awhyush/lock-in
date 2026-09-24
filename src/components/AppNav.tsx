"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CirclesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8.5" cy="8.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="10.5" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 19c.6-2.8 2.6-4.4 5-4.4s4.4 1.6 5 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.5 19c.4-2 1.8-3.3 3.8-3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PlanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v15.5L15 18.5l-3 2-3-2-3.5 2V5A1.5 1.5 0 0 1 7 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8.2" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 19.5c1-3.5 3.8-5.5 7.5-5.5s6.5 2 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon, active: (p: string) => p === "/dashboard" },
  { href: "/circles", label: "Circles", Icon: CirclesIcon, active: (p: string) => p.startsWith("/circles") },
  { href: "/settings", label: "Plan", Icon: PlanIcon, active: (p: string) => p === "/settings" },
  { href: "/profile", label: "Profile", Icon: ProfileIcon, active: (p: string) => p === "/profile" },
];

/** Fixed floating bottom nav shown on every authenticated page: four labeled tabs
 * (Home / Circles / Plan / Profile). Account actions (theme, sign out) live on the
 * Profile page instead of being crammed in here as unlabeled icons. */
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
      <div className="flex w-full max-w-sm items-stretch gap-1 rounded-[1.75rem] bg-[#171e19] p-2 shadow-soft">
        {TABS.map(({ href, label, Icon, active }) => {
          const isActive = active(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 rounded-[1.25rem] py-2 transition-colors ${
                isActive ? "bg-accent text-accent-ink" : "text-[#eeebe3]/70 hover:text-[#eeebe3]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
