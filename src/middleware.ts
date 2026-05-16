import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require NO authentication (public)
const PUBLIC_ROUTES = ["/", "/login", "/register"];

// Routes that require authentication
const PROTECTED_PREFIX = "/dashboard";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("cos_token")?.value;

  const isProtected = pathname.startsWith(PROTECTED_PREFIX);
  const isPublicAuth = pathname === "/login" || pathname === "/register";

  // 1. Unauthenticated user tries to access a protected route → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname); // preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // 2. Already authenticated user visits login/register → redirect to dashboard
  if (isPublicAuth && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes EXCEPT static files and Next internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
