import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Admin password from environment (server-side only reference)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bonsai";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const mode = (process.env.ADMIN_AUTH_MODE || "cookie").toLowerCase();
    if (mode === "token") {
      // In token mode, we cannot validate localStorage-based tokens here.
      // Let client-side guard handle redirects.
      return NextResponse.next();
    }
    const pass = req.cookies.get("admin_pass")?.value;
    if (pass !== ADMIN_PASSWORD) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin-login";
      // Preserve existing query (e.g., fid)
      // url.search is already set on clone(); keep as-is
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Limit the middleware to only the admin route
export const config = {
  matcher: ["/admin/:path*"],
};
