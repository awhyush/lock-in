import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";

// Loaded here rather than in the root layout so this stays scoped to the unauthenticated
// pages (landing/login/signup/forgot/reset) that use this type system — the authenticated
// app keeps Nunito everywhere else untouched. Each export's `.variable` just defines a CSS
// custom property scoped to whatever element it's applied to; apply it on a wrapper div.
export const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  weight: ["700", "900"],
  subsets: ["latin"],
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const inter = Inter({
  variable: "--font-inter",
  weight: ["300", "400"],
  subsets: ["latin"],
});

export const BRUTALIST_FONT_VARS = `${interTight.variable} ${jetbrainsMono.variable} ${inter.variable}`;
