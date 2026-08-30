import { redirect } from "next/navigation";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (sessionId) redirect(`/api/stripe/complete?session_id=${encodeURIComponent(sessionId)}`);
  redirect("/studio?paid=1");
}
