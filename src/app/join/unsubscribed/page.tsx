import type { Metadata } from "next";

export const metadata: Metadata = { title: "Unsubscribed" };

export default async function UnsubscribedPage({ searchParams }: { searchParams: Promise<{ invalid?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="eyebrow">Fan Pot</p>
      <h1 className="display mt-3 text-4xl">{sp.invalid ? "Link not found" : "You're unsubscribed"}</h1>
      <p className="mt-4 text-mist">
        {sp.invalid
          ? "That unsubscribe link didn't match a contact. If you keep getting email, reply to it and we'll remove you."
          : "You won't get fan pot emails anymore. Changed your mind? You can rejoin anytime."}
      </p>
      <a href="/join" className="btn-ghost mt-8 flex h-12 w-full">
        Back to the Fan Pot
      </a>
    </div>
  );
}
