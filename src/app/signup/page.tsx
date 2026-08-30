import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="eyebrow">Artists & filmmakers</p>
      <h1 className="display mt-3 text-5xl">Join Callboard</h1>
      <p className="mt-4 text-mist">
        Valid email. Cash App cashtag for winnings. Blind is $20 with your name off. Tracks and videos are $5.
      </p>
      <AuthForm mode="signup" next={next || "/enter"} />
    </div>
  );
}
