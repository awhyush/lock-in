import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth?.user);
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password";
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname === "/onboarding" ||
    pathname === "/settings" ||
    pathname === "/profile" ||
    pathname.startsWith("/circles");

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/settings",
    "/profile",
    "/circles/:path*",
  ],
};
