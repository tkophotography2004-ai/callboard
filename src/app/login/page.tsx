import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="eyebrow">Welcome back</p>
      <h1 className="display mt-3 text-5xl">Sign in</h1>
      <AuthForm mode="login" next={next || "/studio"} />
    </div>
  );
}
