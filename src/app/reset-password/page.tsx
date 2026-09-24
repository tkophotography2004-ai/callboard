import ResetPasswordForm from "./ui";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="eyebrow">Account</p>
      <h1 className="display mt-3 text-5xl">Reset password</h1>
      <p className="mt-4 text-mist">Choose a new password for your Scroll Call account.</p>
      <ResetPasswordForm token={token || ""} />
    </div>
  );
}
