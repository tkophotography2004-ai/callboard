import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getSessionUser } from "@/lib/auth";
import { APP_NAME, TAGLINE, siteUrl } from "@/lib/config";
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
    default: `${APP_NAME} — ${TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Blind $20 talent board — names off, Keep/Pass only. Tracks and videos $5. Clicks never rank the pot. Winners paid on Cash App.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: APP_NAME,
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
        {!store.chargesLive && (
          <div className="bg-copper-400 px-4 py-2 text-center text-[11px] uppercase tracking-[0.2em] text-ink-950">
            Founding board — free to enter. Cash pot and charges are off until the house opens them.
          </div>
        )}
        <Header user={user} />
        <main className="min-h-[80dvh] pb-24 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
