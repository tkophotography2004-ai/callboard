import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LoungeNav from "@/components/LoungeNav";
import { getSessionUser } from "@/lib/auth";
import LiveBadge from "@/components/LiveBadge";
import { APP_NAME_MARK, TAGLINE, siteUrl } from "@/lib/config";
import { readStore } from "@/lib/store";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${APP_NAME_MARK} — ${TAGLINE}`,
    template: `%s · ${APP_NAME_MARK}`,
  },
  description:
    "Blind $30 music board — names off, Keep/Pass only. $5 launch lounges (regular $10). Fans earn from the fan pot. Clicks never rank. Winners paid on Cash App.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: APP_NAME_MARK,
    description: TAGLINE,
    images: ["/seed/hero.jpg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09080a",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const store = await readStore();
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="grain font-sans antialiased">
        <div className={`flex justify-center px-4 py-2 ${store.chargesLive ? "bg-[#05140a]" : "bg-copper-400"}`}>
          <LiveBadge live={Boolean(store.chargesLive)} href="/enter" />
        </div>
        <Header user={user} />
        <LoungeNav />
        <main className="min-h-[80dvh] pb-24 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
