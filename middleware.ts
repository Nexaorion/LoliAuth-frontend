import { NextRequest, NextResponse } from "next/server";

const TOKEN_KEY = process.env.NEXT_PUBLIC_TOKEN_COOKIE_KEY || "loliauth_token";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/verify"];
const PROTECTED_PATHS = ["/profile", "/developer", "/kyc", "/oauth/authorize", "/admin", "/security", "/balance"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_KEY)?.value;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // If already logged in, redirect to profile
    if (token) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
    return NextResponse.next();
  }

  // Protected paths require token
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/verify",
    "/profile/:path*",
    "/developer/:path*",
    "/kyc/:path*",
    "/oauth/:path*",
    "/admin/:path*",
    "/security/:path*",
    "/balance/:path*",
  ],
};
