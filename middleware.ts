import { NextRequest, NextResponse } from "next/server";

/** Canonical host: www to apex (308). Apex and preview hosts pass through. */
export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
