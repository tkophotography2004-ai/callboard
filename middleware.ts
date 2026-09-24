import { NextRequest, NextResponse } from "next/server";

/** Canonical host: www to apex (308). */
export function middleware(req: NextRequest) {
  const raw =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "";
  const host = raw.toLowerCase().split(",")[0].trim().split(":")[0];
  if (host === "www.scrollcalllive.com") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = "scrollcalllive.com";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
