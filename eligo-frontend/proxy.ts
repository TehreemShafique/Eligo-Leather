import { NextRequest, NextResponse } from "next/server";
import { COOKIE_KEYS } from "./src/lib/constants";

const PROTECTED_PREFIXES = ["/account"];
const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(COOKIE_KEYS.auth)?.value);

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !hasToken) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (AUTH_PAGES.some((p) => pathname === p) && hasToken) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/login",
    "/register",
  ],
};
