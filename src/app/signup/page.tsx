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
      <p className="eyebrow">Artists, filmmakers & fans</p>
      <h1 className="display mt-3 text-5xl">Join Scroll Call®</h1>
      <p className="mt-4 text-mist">
        Valid email. Cash App cashtag for winnings — artists and fans. Blind is $30 music, name off. Named lounges are
        $5 for launch (regular $10 a submission). Judge to earn from the fan pot.
      </p>
      <AuthForm mode="signup" next={next || "/enter"} />
    </div>
  );
}
